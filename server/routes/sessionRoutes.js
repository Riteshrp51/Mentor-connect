import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createSession,
  getSessions,
  getScheduleContacts,
  getSessionByRoom,
  cancelSession,
} from '../controllers/sessionController.js';

const router = express.Router();

router.use(protect);

router.post('/', createSession);
router.get('/', getSessions);
router.get('/contacts', getScheduleContacts);
router.get('/room/:roomCode', getSessionByRoom);
router.patch('/:id/cancel', cancelSession);

export default router;
