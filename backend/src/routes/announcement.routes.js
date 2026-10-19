import { Router } from 'express';
import { createAnnouncement, getAllAnnouncements, getAnnouncementById, updateAnnouncement, deleteAnnouncement, getAnnouncementsByEvent } from '../controllers/announcement.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getAllAnnouncements);
router.get('/:id', getAnnouncementById);
router.get('/event/:eventId', getAnnouncementsByEvent);

// Protected routes
router.post('/', protect, authorize('admin', 'organizer'), createAnnouncement);
router.put('/:id', protect, updateAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);

export default router;
