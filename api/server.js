import mongoose from 'mongoose';
import app from './app.js';
import { testGeminiConnection } from './services/gemini.js';
console.log('🔧 Starting server initialization...');

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

export default app;
