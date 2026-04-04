import { Router } from 'express';
import { chat, chatStream, summarizeDocuments, testAI, healthCheck } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public endpoints
router.get('/health', healthCheck);
router.post('/test', testAI);

// Protected chat endpoints
router.use(authMiddleware);
router.post('/', chat);
router.post('/stream', chatStream);
router.post('/summarize', summarizeDocuments);

export default router;
