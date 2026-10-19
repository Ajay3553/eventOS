import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model.js';
import { sendPasswordResetEmail } from '../utils/email.utils.js';
import { generateRefreshToken, generateToken, verifyRefreshToken } from '../utils/jwt.utils.js';


const register = async (req, res, next) => {
  try {
    console.log(req.body);
    const { firstName, lastName, email, password, organization } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      organization
    });

    // Generate JWT token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Return user data and token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organization: user.organization,
        role: user.role
      },
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};


const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, organization } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.user._id || req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (organization) user.organization = organization;
    
    // Save updated user
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organization: user.organization,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Return user data and token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organization: user.organization,
        role: user.role
      },
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};


const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organization: user.organization,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};


const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user from database
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const newToken = generateToken(user);

      res.status(200).json({
        success: true,
        token: newToken
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  } catch (error) {
    next(error);
  }
};


const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};


const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail({
        email: user.email,
        subject: 'EventOS Password Reset',
        message: `You requested a password reset. Please click the button below to reset your password. If you didn't request this, please ignore this email.`,
        resetUrl
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
  } catch (error) {
    next(error);
  }
};


const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token and valid expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Set new password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new tokens
    const newToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: newToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};


const googleAuth = async (req, res, next) => {
  try {
    const { idToken, organization } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({ idToken });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }

    const { email, given_name, family_name, picture } = payload;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account must have an email' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      if (!organization) {
        return res.status(200).json({
          success: false,
          message: 'organization is required',
          needOrganization: true,
          googleProfile: { email, firstName: given_name, lastName: family_name, photo: picture }
        });
      }
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!';
      user = await User.create({
        firstName: given_name,
        lastName: family_name,
        email,
        password: randomPassword,
        organization
      });
    } else if (!user.organization && organization) {
      user.organization = organization;
      await user.save();
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organization: user.organization,
        role: user.role,
        photo: picture
      },
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export {
    forgotPassword, getCurrentUser, googleAuth, login, logout, refreshToken, register, resetPassword, updateProfile
};

