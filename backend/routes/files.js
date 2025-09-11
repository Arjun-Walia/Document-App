import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';
import { uploadFile, listFiles, getDocument, deleteFile } from '../controllers/fileController.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
  cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  },
});

const upload = multer({ storage });

router.use(authMiddleware);
router.get('/', listFiles);
router.get('/:id', getDocument);
router.post('/upload', upload.single('file'), uploadFile);
router.delete('/:id', deleteFile);

// Test endpoint to debug upload issues
router.post('/test-upload', (req, res) => {
  console.log('🧪 Test upload endpoint hit:', {
    hasBody: !!req.body,
    hasFile: !!req.file,
    headers: req.headers,
    contentType: req.headers['content-type']
  });
  res.json({ message: 'Test endpoint reached', hasFile: !!req.file });
});

export default router;
