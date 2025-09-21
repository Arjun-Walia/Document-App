// Bootstrap module to ensure environment variables are loaded before any imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the api directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify critical environment variables
if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set. AI features will return degradation errors until you configure it.');
    console.warn('📝  Add GEMINI_API_KEY=your_key to api/.env for full functionality.');
    // Continue startup (degraded mode)
}

if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET not set. Falling back to insecure default. Set JWT_SECRET in production!');
}

// Now import and start the server
const { default: server } = await import('./server.js');
