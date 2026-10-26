import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getMentorList } from '../controllers/mentorController.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import MentorProfile from '../models/MentorProfile.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';
import { autoUpdateExpiredSessions } from '../controllers/sessionController.js';

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
    await autoUpdateExpiredSessions(req.user._id);

    const pendingRequestsCount = await MentorshipRequest.countDocuments({
      mentorId: req.user._id,
      status: 'pending',
    });

    // Calculate real unread messages across all mentor's conversations
    const userConversations = await Conversation.find({ participants: req.user._id }).select('_id');
    const convIds = userConversations.map((c) => c._id);
    const unreadMessagesCount = await Message.countDocuments({
      conversationId: { $in: convIds },
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    });

    const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });
    const averageRating = mentorProfile?.rating?.average || 5.0;

    const sessionsCount = await Session.countDocuments({
      mentorId: req.user._id,
      status: 'upcoming',
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todaySessionsCount = await Session.countDocuments({
      mentorId: req.user._id,
      status: 'upcoming',
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    res.status(200).json({
      status: 'success',
      data: {
        pendingRequestsCount,
        sessionsCount,
        todaySessionsCount,
        unreadMessagesCount,
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
