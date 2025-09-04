import { Router } from 'express';
import { chat } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.post('/', chat);

export default router;
