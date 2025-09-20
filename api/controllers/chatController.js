import Document from '../models/Document.js';
import ChatHistory from '../models/ChatHistory.js';
import { generateWithGemini, generateStreamWithGemini, chatWithGemini } from '../services/gemini.js';

// Build optimized prompt for document Q&A with instruct model
function buildDocumentPrompt(question, docs) {
  const context = docs
    .map((doc, i) => {
      const chunks = doc.chunks.slice(0, 4); // Further reduced to 4 chunks for speed
      const content = chunks.map(chunk => 
        chunk.text.substring(0, 500) // Limit each chunk to 500 chars
      ).join('\n\n');
      return `Doc${i + 1} "${doc.originalName}": ${content}`;
    })
    .join('\n---\n');

  // Very concise prompt for faster processing
  return `Based on these documents, answer the question concisely:

${context}

Q: ${question}
A:`;
}

// Minimal prompt for fallback when full context times out
function buildMinimalPrompt(question, docs) {
  const context = docs
    .map((doc, i) => {
      const firstChunk = doc.chunks[0]; // Only use first chunk
      const content = firstChunk ? firstChunk.text.substring(0, 200) : ''; // Very short
      return `${doc.originalName}: ${content}`;
    })
    .join('\n');

  return `${context}\n\nQ: ${question}\nA:`;
}

// Build prompt for document summarization
function buildSummaryPrompt(docs) {
  const content = docs
    .map((doc, i) => {
      const chunks = doc.chunks.slice(0, 5); // Further reduced
      const text = chunks.map(chunk => 
        chunk.text.substring(0, 400) // Limit each chunk
      ).join('\n');
      return `Doc${i + 1} "${doc.originalName}": ${text}`;
    })
    .join('\n---\n');

  return `Summarize these documents briefly:

${content}

Summary:`;
}

export const chat = async (req, res) => {
  try {
    const { question, documentIds, type = 'question' } = req.body;
    
    if (!question && type !== 'summary') {
      return res.status(400).json({ 
        error: 'Question is required for Q&A mode',
        success: false 
      });
    }

    console.log(`📝 Processing ${type} request from user ${req.user?.id || 'anonymous'}`);

    // Fetch relevant documents
    let docs;
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      docs = await Document.find({ 
        _id: { $in: documentIds }, 
        userId: req.user?.id || null 
      });
      console.log(`📄 Using ${docs.length} specified documents`);
    } else {
      docs = await Document.find({ 
        userId: req.user?.id || null 
      }).sort({ createdAt: -1 }).limit(5);
      console.log(`📄 Using ${docs.length} most recent documents`);
    }

    if (docs.length === 0) {
      return res.status(404).json({ 
        error: 'No documents found. Please upload documents first.',
        success: false 
      });
    }

    // Build appropriate prompt based on request type
    let prompt;
    if (type === 'summary') {
      prompt = buildSummaryPrompt(docs);
    } else {
      prompt = buildDocumentPrompt(question, docs);
    }

    // Generate AI response with Gemini with retry mechanism
    let result;
    
    try {
      console.log(`🔄 Processing with Gemini using ${docs.length} documents`);
      result = await generateWithGemini(prompt, {
        temperature: 0.2,
        topP: 0.8,
        maxTokens: 1000,
        maxRetries: 3,      // Retry up to 3 times
        baseDelay: 1500     // Start with 1.5 second delay
      });
      
      console.log(`✅ Generated response in ${result.responseTime}ms using ${result.tokensUsed} tokens (${result.attempts} attempts)`);
    } catch (error) {
      console.error('❌ Gemini request failed:', error.message);
      
      // Provide user-friendly error messages
      if (error.message.includes('overloaded')) {
        return res.status(503).json({
          success: false,
          error: 'The AI service is currently experiencing high demand. Please try again in a few moments.',
          code: 'SERVICE_OVERLOADED',
          retryAfter: 30 // seconds
        });
      }
      
      if (error.message.includes('quota exceeded')) {
        return res.status(429).json({
          success: false,
          error: 'Daily AI usage limit reached. Please try again tomorrow.',
          code: 'QUOTA_EXCEEDED'
        });
      }
      
      throw error;
    }

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        answer: result.response,
        type: type,
        model: result.model,
        responseTime: result.responseTime,
        tokensUsed: result.tokensUsed,
        sourceDocuments: docs.map(doc => ({
          id: doc._id,
          name: doc.originalName,
          chunks: doc.chunks.length
        })),
        documentCount: docs.length,
        processingTime: result.responseTime,
        timestamp: new Date().toISOString()
      }
    };

    // Save chat history (don't fail the request if this fails)
    try {
      if (req.user?.id) {
        const chatHistory = new ChatHistory({
          userId: req.user.id,
          documentId: docs[0]._id, // Primary document
          title: (question || type).length > 50 ? (question || type).substring(0, 50) + '...' : (question || type),
          messages: [
            {
              role: 'user',
              content: question,
              timestamp: new Date()
            },
            {
              role: 'assistant',
              content: result.response,
              timestamp: new Date(),
              model: result.model,
              tokens: result.tokensUsed || 0
            }
          ],
          totalTokens: result.tokensUsed || 0,
          summary: type === 'summary' ? result.response.substring(0, 200) : (question || '').substring(0, 200),
          isActive: true
        });
        
        await chatHistory.save();
        
        // Update document chat stats
        await Promise.all(docs.map(doc => 
          Document.findByIdAndUpdate(doc._id, {
            $inc: { 'stats.chats': 1 },
            $set: { 'stats.lastAccessed': new Date() }
          })
        ));
        
        console.log('💾 Chat history saved and document stats updated');
      }
    } catch (historyError) {
      console.warn('⚠️ Failed to save chat history:', historyError.message);
      // Don't fail the request, just log the warning
    }

    console.log(`✅ Generated ${type} response in ${result.responseTime}ms`);
    res.json(responseData);

  } catch (error) {
    console.error('❌ Chat controller error:', error.message);
    
    // Handle specific error types
    if (error.message.includes('Ollama server is not running')) {
      return res.status(503).json({
        error: 'AI service is currently unavailable. Please try again later.',
        success: false,
        details: error.message
      });
    }
    
    if (error.message.includes('Model') && error.message.includes('not found')) {
      return res.status(503).json({
        error: 'AI model is not available. Please contact support.',
        success: false,
        details: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to generate response. Please try again.',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// New endpoint for document summarization
export const summarizeDocuments = async (req, res) => {
  try {
    const { documentIds } = req.body;
    
    req.body.type = 'summary';
    req.body.question = 'Please summarize these documents';
    
    // Reuse the chat function with summary type
    await chat(req, res);
    
  } catch (error) {
    console.error('❌ Summarization error:', error.message);
    res.status(500).json({
      error: 'Failed to summarize documents',
      success: false
    });
  }
};

// Streaming chat endpoint for real-time responses
export const chatStream = async (req, res) => {
  try {
    const { question, documentIds } = req.body;
    
    if (!question) {
      return res.status(400).json({ 
        error: 'Question is required',
        success: false 
      });
    }

    console.log(`🌊 Processing streaming request from user ${req.user?.id || 'anonymous'}`);

    // Fetch relevant documents (limit to 3 for faster streaming)
    let docs;
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      docs = await Document.find({ 
        _id: { $in: documentIds }, 
        userId: req.user?.id || null 
      }).limit(3);
    } else {
      docs = await Document.find({ 
        userId: req.user?.id || null 
      }).sort({ createdAt: -1 }).limit(3);
    }

    if (docs.length === 0) {
      return res.status(404).json({ 
        error: 'No documents found. Please upload documents first.',
        success: false 
      });
    }

    const prompt = buildDocumentPrompt(question, docs);

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    try {
      const stream = await generateStreamWithGemini(prompt, {
        temperature: 0.2,
        maxTokens: 1000
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullResponse += chunkText;
          res.write(`data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ 
        chunk: '', 
        done: true, 
        fullResponse,
        sourceDocuments: docs.map(doc => ({
          id: doc._id,
          name: doc.originalName
        }))
      })}\n\n`);
      res.end();

    } catch (error) {
      console.error('❌ Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('❌ Streaming chat controller error:', error.message);
    res.status(500).json({
      error: 'Failed to start streaming response',
      success: false
    });
  }
};

// Simple test endpoint for AI performance
export const testAI = async (req, res) => {
  try {
    const { prompt = "Hello, how are you?" } = req.body;
    
    console.log('🧪 Testing Gemini with minimal prompt...');
    const startTime = Date.now();
    
    const result = await generateWithGemini(prompt, {
      temperature: 0.1,
      maxTokens: 100
    });

    const totalTime = Date.now() - startTime;
    
    res.json({
      success: true,
      response: result.response,
      responseTime: totalTime,
      aiTime: result.responseTime,
      model: result.model,
      tokensUsed: result.tokensUsed
    });
    
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'gemini'
    });
  }
};

// Health check endpoint for AI service
export const healthCheck = async (req, res) => {
  try {
    const { testGeminiConnection } = await import('../services/gemini.js');
    await testGeminiConnection();
    
    res.json({
      success: true,
      message: 'Gemini AI service is healthy',
      model: 'gemini-1.5-flash',
      provider: 'Google Gemini',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Gemini AI service is unavailable',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
