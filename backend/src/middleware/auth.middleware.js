import jwt from 'jsonwebtoken';
import {User} from '../models/user.model.js';
import {ApiError} from '../utils/apiError.js';

const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError(401, 'Not authorized to access this route - No token provided'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user in database
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        // In case user was deleted but token is valid
        req.user = decoded;
      } else {
        req.user = user;
      }

      // Ensure req.user.id is always available
      if (req.user && !req.user.id && req.user._id) {
        req.user.id = req.user._id.toString();
      }

      next();
    } catch (err) {
      return next(new ApiError(401, 'Not authorized to access this route - Invalid or expired token'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access based on user role(s)
 * @param {...String} roles - Allowed roles (e.g. 'admin', 'organizer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authorized to access this route - User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
};

export{
  protect,
  authorize
};
