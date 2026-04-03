import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import chatRoutes from './routes/chat.js';
import chatHistoryRoutes from './routes/chatHistory.js';
import profileRoutes from './routes/profile.js';
import { testGeminiConnection } from './services/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      gemini: 'check /api/health/gemini'
    }
  });
});

app.get('/api/health/gemini', async (req, res) => {
  try {
    const isConnected = await testGeminiConnection();
    res.json({
      status: 'OK',
      gemini: isConnected ? 'connected' : 'disconnected',
      model: 'gemini-1.5-flash',
      provider: 'Google Gemini'
    });
  } catch (error) {
    const isTemporaryError = error.message.includes('503') ||
      error.message.includes('overloaded') ||
      error.message.includes('temporarily unavailable');

    res.status(isTemporaryError ? 200 : 500).json({
      status: isTemporaryError ? 'DEGRADED' : 'ERROR',
      gemini: 'temporarily_unavailable',
      error: error.message,
      note: isTemporaryError ? 'Service is experiencing high load but will retry automatically' : undefined
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'DocumentAI Backend',
    version: '1.0.0',
    aiProvider: 'Google Gemini',
    model: 'gemini-1.5-flash',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'DocumentAI Backend',
    version: '1.0.0',
    aiProvider: 'Google Gemini',
    model: 'gemini-1.5-flash',
    timestamp: new Date().toISOString(),
    note: 'Frontend served by Vercel static output in production'
  });
});

app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    success: false
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    success: false,
    path: req.originalUrl
  });
});

export default app;
