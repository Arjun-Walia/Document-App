import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🔧 Starting server initialization...');

import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import chatRoutes from './routes/chat.js';
import chatHistoryRoutes from './routes/chatHistory.js';
import profileRoutes from './routes/profile.js';
import { testGeminiConnection } from './services/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Creating Express app...');

const app = express();

// Middleware
console.log('🔧 Setting up middleware...');
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow all origins in production
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
  console.log('🔧 Serving frontend from:', frontendPath);
  app.use(express.static(frontendPath));
}

console.log('🔧 Setting up routes...');

// Health check endpoints
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
    // Don't return 500 for temporary overload - this is expected
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/profile', profileRoutes);

// Health check endpoint
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

// Serve frontend for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const frontendPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    res.sendFile(frontendPath);
  });
} else {
  // Development: serve API info on root
  app.get('/', (_req, res) => {
    res.json({ 
      status: 'ok', 
      name: 'DocumentAI Backend',
      version: '1.0.0',
      aiProvider: 'Google Gemini',
      model: 'gemini-1.5-flash',
      timestamp: new Date().toISOString(),
      note: 'Frontend served separately in development'
    });
  });
}

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    success: false
  });
});

// Handle 404s for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    success: false,
    path: req.originalUrl
  });
});

// Catch-all for non-API routes in production (serve frontend)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const frontendPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    res.sendFile(frontendPath, (err) => {
      if (err) {
        console.error('Error serving frontend:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });
}

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/document_app';

console.log('🔧 Starting server...');

// Startup sequence
async function startServer() {
  try {
    // Test Gemini AI connection - but don't fail startup if it's down
    console.log('🤖 Testing Gemini AI connection...');
    try {
      await testGeminiConnection();
      console.log('✅ Gemini AI service ready');
    } catch (error) {
      console.log('⚠️ Gemini AI service unavailable during startup (this is OK)');
      console.log('📝 Reason:', error.message);
      console.log('🔄 The service will retry automatically when requests are made');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('✅ Connected to MongoDB successfully');
    
    const dbState = mongoose.connection.readyState;
    console.log(`📊 Database state: ${dbState === 1 ? 'Connected' : 'Not Connected'}`);

    app.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📍 Server running on http://localhost:${PORT}`);
      console.log(`🤖 AI Provider: Google Gemini (gemini-1.5-flash)`);
      console.log(`🗄️  Database: Connected to ${MONGODB_URI}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('─'.repeat(60));
      console.log('📋 Available endpoints:');
      console.log('   GET  /                    - Health check');
      console.log('   POST /api/auth/register   - User registration');
      console.log('   POST /api/auth/login      - User login');
      console.log('   POST /api/files/upload    - Upload documents');
      console.log('   GET  /api/files           - Get user documents');
      console.log('   GET  /api/files/:id       - Get specific document');
      console.log('   DELETE /api/files/:id     - Delete document');
      console.log('   GET  /api/chat-history    - Get chat history');
      console.log('   POST /api/chat-history    - Create chat session');
      console.log('   DELETE /api/chat-history/:id - Delete chat');
      console.log('   GET  /api/profile         - Get user profile');
      console.log('   PUT  /api/profile         - Update profile');
      console.log('   GET  /api/profile/analytics - Get analytics');
      console.log('   POST /api/chat            - Chat with documents');
      console.log('   POST /api/chat/stream     - Stream chat responses');
      console.log('   POST /api/chat/summarize  - Summarize documents');
      console.log('   GET  /api/chat/health     - AI service health');
      console.log('   POST /api/chat/test       - Test AI performance');
      console.log('─'.repeat(60));
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    console.error('❌ Full error:', error);
    
    if (error.message.includes('ECONNREFUSED') && error.message.includes('27017')) {
      console.error('💡 MongoDB connection refused. Please ensure MongoDB is running on port 27017');
    } else if (error.message.includes('MongoDB') || error.message.includes('mongoose')) {
      console.error('💡 MongoDB connection issue. Please check your MongoDB installation');
    }
    
    if (error.message.includes('Gemini') || error.message.includes('API_KEY')) {
      console.error('🔑 Gemini API issue. Please check your API key and internet connection');
    }
    
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('📴 Shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('🔧 About to start server...');
startServer();
