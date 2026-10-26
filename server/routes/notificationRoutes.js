import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  markNotificationsRead,
  clearNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/mark-read', markNotificationsRead);
router.delete('/', clearNotifications);

export default router;
