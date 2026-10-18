import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createRequest,
  getSentRequests,
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
} from '../controllers/requestController.js';

const router = express.Router();

// Student Routes
router.post('/', protect, authorize('student'), createRequest);
router.get('/sent', protect, authorize('student'), getSentRequests);
router.patch('/:id/cancel', protect, authorize('student'), cancelRequest);

// Mentor Routes
router.get('/received', protect, authorize('mentor'), getReceivedRequests);
router.patch('/:id/accept', protect, authorize('mentor'), acceptRequest);
router.patch('/:id/reject', protect, authorize('mentor'), rejectRequest);

export default router;
