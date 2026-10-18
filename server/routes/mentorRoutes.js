import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getMentorList } from '../controllers/mentorController.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import MentorProfile from '../models/MentorProfile.js';

const router = express.Router();

// Route: GET /api/mentor/dashboard
// Access: Private (Mentor only)
router.get('/mentor/dashboard', protect, authorize('mentor'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Mentor Dashboard (Protected API)',
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

// Route: GET /api/mentor/dashboard-summary
// Access: Private (Mentor only)
router.get('/mentor/dashboard-summary', protect, authorize('mentor'), async (req, res, next) => {
  try {
    const pendingRequestsCount = await MentorshipRequest.countDocuments({
      mentorId: req.user._id,
      status: 'pending',
    });

    const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });
    const averageRating = mentorProfile?.rating?.average || 5.0;

    res.status(200).json({
      status: 'success',
      data: {
        pendingRequestsCount,
        sessionsCount: 0,
        averageRating,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Route: GET /api/mentors
// Access: Private (Student only)
router.get('/mentors', protect, authorize('student'), getMentorList);

// Backward compatible aliases
router.get('/dashboard', protect, authorize('mentor'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Mentor Dashboard (Protected API)',
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

export default router;
