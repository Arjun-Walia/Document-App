import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';
import { uploadFile, listFiles, getDocument, deleteFile } from '../controllers/fileController.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + safeName);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Unsupported file type'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

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
