import {Router} from 'express';
import { getAllUsers, getUserById, updateUserRole } from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);

export default router;
