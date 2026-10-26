import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getConversations,
  getConversationById,
  getConversationByRequest,
  getMessages,
  sendMessage,
  getUnreadSummary,
  markConversationAsRead,
} from '../controllers/conversationController.js';

const router = express.Router();

// All conversation routes require authentication
router.use(protect);

router.get('/unread-summary', getUnreadSummary);
router.get('/', getConversations);
router.get('/request/:requestId', getConversationByRequest);
router.get('/:id', getConversationById);
router.patch('/:id/read', markConversationAsRead);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

export default router;
