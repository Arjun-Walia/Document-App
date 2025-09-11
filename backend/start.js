// Bootstrap module to ensure environment variables are loaded before any imports
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Verify critical environment variables
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY environment variable is required. Please set it in your .env file.');
    console.error('📝 Create a .env file in the backend directory and add: GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
}

// Now import and start the server
const { default: server } = await import('./server.js');
