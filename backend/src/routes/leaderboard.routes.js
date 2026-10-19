import { Router } from 'express';
import { getEventLeaderboard, getParticipantScore, getTopPerformers, getOrganizationLeaderboard, updateScore } from '../controllers/leaderboard.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/top', getTopPerformers);
router.get('/organizations', getOrganizationLeaderboard);
router.get('/event/:eventId', getEventLeaderboard);

// Protected routes
router.get('/event/:eventId/user/:userId', protect, getParticipantScore);
router.route('/event/:eventId/user/:userId')
  .post(protect, authorize('admin', 'organizer'), updateScore)
  .put(protect, authorize('admin', 'organizer'), updateScore);

export default router;
