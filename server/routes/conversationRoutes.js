import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getConversations,
  getConversationById,
  getConversationByRequest,
  getMessages,
  sendMessage,
} from '../controllers/conversationController.js';

const router = express.Router();

// All conversation routes require authentication
router.use(protect);

router.get('/', getConversations);
router.get('/request/:requestId', getConversationByRequest);
router.get('/:id', getConversationById);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

export default router;
