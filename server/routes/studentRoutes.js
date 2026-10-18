import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Route: GET /api/student/dashboard
// Access: Private (Student only)
router.get('/dashboard', protect, authorize('student'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Student Dashboard (Protected API)',
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

// Route: GET /api/student/dashboard-summary
// Access: Private (Student only)
router.get('/dashboard-summary', protect, authorize('student'), async (req, res, next) => {
  try {
    const requestsCount = await MentorshipRequest.countDocuments({ studentId: req.user._id });
    const unreadMessagesCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.status(200).json({
      status: 'success',
      data: {
        requestsCount,
        sessionsCount: 0,
        unreadMessagesCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
