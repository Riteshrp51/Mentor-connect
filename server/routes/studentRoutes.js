import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Notification from '../models/Notification.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';
import { autoUpdateExpiredSessions } from '../controllers/sessionController.js';

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
    await autoUpdateExpiredSessions(req.user._id);

    const requestsCount = await MentorshipRequest.countDocuments({ studentId: req.user._id });

    // Calculate real unread messages across all student's conversations
    const userConversations = await Conversation.find({ participants: req.user._id }).select('_id');
    const convIds = userConversations.map((c) => c._id);
    const unreadMessagesCount = await Message.countDocuments({
      conversationId: { $in: convIds },
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    });

    const sessionsCount = await Session.countDocuments({
      studentId: req.user._id,
      status: 'upcoming',
    });

    res.status(200).json({
      status: 'success',
      data: {
        requestsCount,
        sessionsCount,
        unreadMessagesCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
