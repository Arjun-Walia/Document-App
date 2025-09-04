import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import Document from '../models/Document.js';
import { extractPdfText } from '../services/pdf.js';

const CHUNK_SIZE = 1200; // characters

function chunkText(text) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + CHUNK_SIZE, text.length);
    const slice = text.slice(i, end);
    chunks.push({ text: slice, source: { start: i, end } });
    i = end;
  }
  return chunks;
}

async function extractText(filePath, mimeType) {
  if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
    return await extractPdfText(filePath);
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filePath.toLowerCase().endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  // Fallback for txt, md, code files
  const content = await fs.readFile(filePath, 'utf8');
  return content;
}

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const text = await extractText(file.path, file.mimetype);
    const chunks = chunkText(text);

    const doc = await Document.create({
      userId: req.user?.id || null,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      chunks,
    });

    res.json({ id: doc._id, filename: doc.filename, chunks: doc.chunks.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const listFiles = async (req, res) => {
  const docs = await Document.find({ userId: req.user?.id || null }).select('_id originalName filename createdAt');
  res.json(docs);
};

export const getDocument = async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.user?.id || null });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
};
