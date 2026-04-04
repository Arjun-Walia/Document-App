import mongoose from 'mongoose';
import app from './_src/app.js';
import { testGeminiConnection } from './_src/services/gemini.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/document_app';

let initializationPromise = null;

async function initializeServices() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4
      });
    }

    try {
      await testGeminiConnection();
    } catch (error) {
      console.log('Gemini AI service unavailable during startup (continuing in degraded mode)');
      console.log('Reason:', error.message);
    }
  })();

  try {
    await initializationPromise;
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    await initializeServices();
    return app(req, res);
  } catch (error) {
    console.error('Vercel handler initialization failed:', error.message);
    return res.status(500).json({
      error: 'Initialization failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Server initialization error',
      success: false
    });
  }
}
