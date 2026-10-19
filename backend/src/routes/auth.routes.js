import { Router } from 'express';
import { register, login, getCurrentUser, refreshToken, logout, forgotPassword, resetPassword, updateProfile, googleAuth } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/google', googleAuth);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);

export default router;
