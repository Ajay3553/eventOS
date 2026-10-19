import { Router } from 'express';
import { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, registerForEvent, cancelRegistration, getEventParticipants } from '../controllers/event.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Protected routes
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);

// Registration routes
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);

// Participants route
router.get('/:id/participants', protect, getEventParticipants);

export default router;