import { Router } from 'express';
import { getUserSettings, updateSystemSettings, getSystemSettings, updateUserSettings } from '../controllers/settings.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All settings routes are protected
router.use(protect);

// User settings routes
router.get('/user', getUserSettings);
router.put('/user', updateUserSettings);

// System settings routes (admin only)
router.get('/system', authorize('admin'), getSystemSettings);
router.put('/system', authorize('admin'), updateSystemSettings);

export default router;
