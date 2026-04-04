import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash'; // Fast model for quick responses

// Simple circuit breaker to avoid hammering overloaded service
let circuitBreaker = {
  failureCount: 0,
  lastFailureTime: null,
  isOpen: false,
  resetTimeout: 60000 // 1 minute
};

if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Gemini module loaded - API_KEY available:', !!API_KEY);
}

let genAI;
let model;

// Initialize Gemini AI
function initializeGemini() {
  try {
    const currentApiKey = process.env.GEMINI_API_KEY;
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Initialize - API_KEY available:', !!currentApiKey);
    }
    
    if (!currentApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    genAI = new GoogleGenerativeAI(currentApiKey);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
    console.log(`✅ Gemini AI initialized with model: ${MODEL_NAME}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini:', error.message);
    throw error;
  }
}

// Test Gemini connection
export async function testGeminiConnection() {
  try {
    if (!model) {
      initializeGemini();
    }
    
    const result = await model.generateContent('Hello');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Gemini connection failed:', error.message);
    
    if (error.message.includes('API key not valid')) {
      console.log('🔑 The API key appears to be invalid or expired.');
      console.log('📝 Please check:');
      console.log('   1. Visit https://aistudio.google.com/app/apikey');
      console.log('   2. Generate a new API key');
      console.log('   3. Update your .env file with the new key');
      console.log('   4. Make sure the Gemini API service is enabled');
    }
    
    throw new Error(`Gemini service unavailable: ${error.message}`);
  }
}

// Generate response using Gemini with retry mechanism
export async function generateWithGemini(prompt, options = {}) {
  // Check circuit breaker
  if (circuitBreaker.isOpen) {
    const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
    if (timeSinceLastFailure < circuitBreaker.resetTimeout) {
      throw new Error(`Service temporarily unavailable. Circuit breaker is open. Try again in ${Math.round((circuitBreaker.resetTimeout - timeSinceLastFailure) / 1000)} seconds.`);
    } else {
      // Reset circuit breaker
      console.log('🔄 Circuit breaker reset - attempting to reconnect...');
      circuitBreaker.isOpen = false;
      circuitBreaker.failureCount = 0;
    }
  }

  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!model) {
        initializeGemini();
      }

      console.log(`🤖 Generating response with ${MODEL_NAME}... (Attempt ${attempt}/${maxRetries})`);
      console.log(`📏 Prompt size: ${prompt.length} characters`);
      
      const startTime = Date.now();
      
      // Configure generation settings
      const generationConfig = {
        temperature: options.temperature || 0.2,
        topP: options.topP || 0.8,
        topK: options.topK || 40,
        maxOutputTokens: options.maxTokens || 800,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ Response generated in ${responseTime}ms on attempt ${attempt}`);
      
      // Reset circuit breaker on success
      if (circuitBreaker.failureCount > 0) {
        console.log('✅ Circuit breaker reset after successful request');
        circuitBreaker.failureCount = 0;
        circuitBreaker.isOpen = false;
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      return {
        response: text.trim(),
        model: MODEL_NAME,
        responseTime,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        attempts: attempt
      };
      
    } catch (error) {
      console.error(`❌ Gemini generation failed (Attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Handle specific error types that shouldn't be retried
      if (error.message.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your configuration.');
      }
      
      if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('Gemini API quota exceeded. Please try again later.');
      }
      
      // Check for retryable errors (503, overloaded, rate limits, etc.)
      const isRetryableError = 
        error.message.includes('503 Service Unavailable') ||
        error.message.includes('The model is overloaded') ||
        error.message.includes('RATE_LIMIT_EXCEEDED') ||
        error.message.includes('RESOURCE_EXHAUSTED') ||
        error.message.includes('INTERNAL') ||
        error.message.includes('UNAVAILABLE') ||
        error.message.includes('DEADLINE_EXCEEDED') ||
        error.message.includes('temporarily unavailable');
      
      // Update circuit breaker for overload errors
      if (error.message.includes('503 Service Unavailable') || error.message.includes('The model is overloaded')) {
        circuitBreaker.failureCount++;
        circuitBreaker.lastFailureTime = Date.now();
        
        // Open circuit breaker after 3 consecutive overload errors
        if (circuitBreaker.failureCount >= 3) {
          circuitBreaker.isOpen = true;
          console.log('🔴 Circuit breaker opened due to repeated overload errors');
        }
      }
      
      if (isRetryableError && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
        const jitter = Math.random() * 1000; // Add random jitter (0-1s) to avoid thundering herd
        const totalDelay = Math.min(delay + jitter, 10000); // Cap at 10 seconds
        
        console.log(`🔄 Service overloaded, retrying in ${Math.round(totalDelay)}ms... (${maxRetries - attempt} retries remaining)`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        continue;
      }
      
      // If this is the last attempt or non-retryable error, throw
      if (attempt === maxRetries) {
        console.error('❌ All retry attempts exhausted. The Gemini service may be experiencing high load.');
      }
      
      throw new Error(`AI generation failed after ${attempt} attempt(s): ${error.message}`);
    }
  }
}

// Stream response using Gemini (for real-time responses)
export async function generateStreamWithGemini(prompt, options = {}) {
  try {
    if (!model) {
      initializeGemini();
    }

    console.log(`🌊 Starting streaming response with ${MODEL_NAME}...`);
    
    const generationConfig = {
      temperature: options.temperature || 0.2,
      topP: options.topP || 0.8,
      topK: options.topK || 40,
      maxOutputTokens: options.maxTokens || 800,
    };

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    return result.stream;
  } catch (error) {
    console.error('❌ Gemini streaming failed:', error.message);
    throw new Error(`AI streaming failed: ${error.message}`);
  }
}

// Chat with conversation context support
export async function chatWithGemini(messages, options = {}) {
  try {
    if (!model) {
      initializeGemini();
    }

    // Convert messages to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const generationConfig = {
      temperature: options.temperature || 0.2,
      topP: options.topP || 0.8,
      topK: options.topK || 40,
      maxOutputTokens: options.maxTokens || 800,
    };

    const result = await model.generateContent({
      contents,
      generationConfig,
    });

    const response = await result.response;
    const text = response.text();
    
    return {
      response: text.trim(),
      model: MODEL_NAME,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (error) {
    console.error('❌ Gemini chat failed:', error.message);
    throw new Error(`AI chat failed: ${error.message}`);
  }
}

// Initialize on module load
initializeGemini();
