import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import Document from '../models/Document.js';
import User from '../models/User.js';
import ChatHistory from '../models/ChatHistory.js';
import { extractPdfText } from '../services/pdf.js';

const CHUNK_SIZE = 1200; // characters
const MAX_DOCUMENTS_PER_USER = 5;

function chunkText(text, filename = 'unknown') {
  const chunks = [];
  let i = 0;
  let page = 1;
  const wordsPerPage = 300; // Rough estimate
  
  while (i < text.length) {
    const end = Math.min(i + CHUNK_SIZE, text.length);
    const slice = text.slice(i, end);
    
    // Calculate approximate page number
    const wordCountSoFar = Math.floor(i / 5); // Rough word count estimate
    const currentPage = Math.floor(wordCountSoFar / wordsPerPage) + 1;
    
    chunks.push({ 
      text: slice, 
      source: { 
        filename: filename,
        page: currentPage,
        start: i, 
        end: end 
      } 
    });
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
    console.log('📁 Upload request received:', {
      hasFile: !!req.file,
      hasUser: !!req.user,
      userId: req.user?.id,
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    const file = req.file;
    if (!file) {
      console.log('❌ No file provided in upload request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Basic validation for allowed mime types
    const allowedMime = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!allowedMime.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Basic size ceiling (10MB) even if multer is configured, as safeguard
    if (file.size > (10 * 1024 * 1024)) {
      return res.status(413).json({ error: 'File too large (max 10MB)' });
    }

    // Check document limit for user
    const userId = req.user?.id;
    let documentCount = 0;
    
    if (userId) {
      documentCount = await Document.countDocuments({ userId, isActive: true });
      console.log(`📊 Current document count for user ${userId}: ${documentCount}/${MAX_DOCUMENTS_PER_USER}`);
      
      if (documentCount >= MAX_DOCUMENTS_PER_USER) {
        console.log(`🚫 Document limit reached for user ${userId}`);
        return res.status(400).json({ 
          error: `Document limit reached. You can upload a maximum of ${MAX_DOCUMENTS_PER_USER} documents.`,
          limit: MAX_DOCUMENTS_PER_USER,
          current: documentCount
        });
      }
    }

    const text = await extractText(file.path, file.mimetype);
    const chunks = chunkText(text, file.originalname);
    
    // Calculate metadata
  const wordCount = text ? text.split(/\s+/).length : 0;
    const pages = file.mimetype === 'application/pdf' ? 
      Math.ceil(text.length / 3000) : // Rough estimate for PDF pages
      Math.ceil(text.length / 2500); // Rough estimate for other docs

    const doc = await Document.create({
      userId: req.user?.id || null,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      chunks: chunks || [],
      metadata: {
        pages,
        wordCount,
        language: 'en', // Could be detected later
        summary: text.substring(0, 200) + '...'
      }
    });

    // Update user stats
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.documentsUploaded': 1 },
        $set: { 'stats.lastActive': new Date() }
      });
    }

    console.log(`✅ Document uploaded successfully: ${doc.originalName} (${doc.chunks.length} chunks)`);

    res.json({ 
      id: doc._id, 
      filename: doc.filename, 
      originalName: doc.originalName,
      chunks: doc.chunks.length,
      metadata: doc.metadata,
      message: `Document uploaded successfully. ${MAX_DOCUMENTS_PER_USER - (documentCount + 1)} slots remaining.`
    });
  } catch (e) {
    console.error('❌ Upload error:', e);
    res.status(500).json({ error: e.message });
  }
};

export const listFiles = async (req, res) => {
  try {
    const docs = await Document.find({ 
      userId: req.user?.id || null, 
      isActive: true 
    })
    .select('_id originalName filename createdAt size metadata stats chunks')
    .sort({ createdAt: -1 });
    
    // Update user stats
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, {
        $set: { 'stats.lastActive': new Date() }
      });
    }
    
    const documentsWithStats = docs.map(doc => ({
      ...doc.toObject(),
      sizeFormatted: formatFileSize(doc.size),
      uploadedAt: doc.createdAt
    }));

    console.log('📋 Retrieved documents:', docs.length);
    documentsWithStats.forEach(doc => {
      console.log(`  - ${doc.originalName}: ${doc.chunks?.length || 0} chunks, pages: ${doc.metadata?.pages || 'N/A'}, words: ${doc.metadata?.wordCount || 'N/A'}`);
    });
    
    res.json({
      documents: documentsWithStats,
      total: docs.length,
      limit: MAX_DOCUMENTS_PER_USER,
      remaining: MAX_DOCUMENTS_PER_USER - docs.length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user?.id;

    const doc = await Document.findOne({ 
      _id: documentId, 
      userId: userId,
      isActive: true 
    });
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Soft delete the document
    await Document.findByIdAndUpdate(documentId, { 
      isActive: false,
      deletedAt: new Date()
    });

    // Delete associated chat histories
    await ChatHistory.updateMany(
      { documentId: documentId },
      { isActive: false }
    );

    // Try to delete physical file
    try {
      const filePath = path.join('uploads', doc.filename);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.warn('Could not delete physical file:', fileError.message);
    }

    // Update user stats
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.documentsUploaded': -1 },
        $set: { 'stats.lastActive': new Date() }
      });
    }

    res.json({ 
      message: 'Document deleted successfully',
      documentId: documentId,
      filename: doc.originalName
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Helper function to format file sizes
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ 
      _id: req.params.id, 
      userId: req.user?.id || null,
      isActive: true 
    });
    
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    // Increment view count
    await Document.findByIdAndUpdate(req.params.id, {
      $inc: { 'stats.views': 1 },
      $set: { 'stats.lastAccessed': new Date() }
    });
    
    // Get full text content for viewer
    const fullText = doc.chunks.map(chunk => chunk.text).join('\n\n');
    
    res.json({
      ...doc.toObject(),
      fullText,
      sizeFormatted: formatFileSize(doc.size)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
