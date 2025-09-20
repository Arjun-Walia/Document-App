import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import ChatHistory from '../models/ChatHistory.js';
import Document from '../models/Document.js';
import User from '../models/User.js';

const router = Router();

// Get all chat histories for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const chatHistories = await ChatHistory.find({ 
      userId, 
      isActive: true 
    })
    .populate('documentId', 'originalName filename')
    .select('title summary totalTokens createdAt updatedAt messages.timestamp')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await ChatHistory.countDocuments({ userId, isActive: true });

    // Add message count to each chat
    const enrichedHistories = chatHistories.map(chat => ({
      ...chat.toObject(),
      messageCount: chat.messages?.length || 0,
      lastMessageAt: chat.messages?.length > 0 ? 
        chat.messages[chat.messages.length - 1].timestamp : 
        chat.createdAt
    }));

    res.json({
      chatHistories: enrichedHistories,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific chat history
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    }).populate('documentId', 'originalName filename');

    if (!chatHistory) {
      return res.status(404).json({ error: 'Chat history not found' });
    }

    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update chat history
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { documentId, messages, title } = req.body;
    const userId = req.user.id;

    // Verify document belongs to user
    const document = await Document.findOne({ 
      _id: documentId, 
      userId,
      isActive: true 
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Calculate total tokens
    const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);

    // Generate title if not provided
    const chatTitle = title || (messages.length > 0 ? 
      messages[0].content.substring(0, 50) + '...' : 
      'New Chat');

    const chatHistory = await ChatHistory.create({
      userId,
      documentId,
      messages,
      title: chatTitle,
      totalTokens
    });

    // Update document stats
    await Document.findByIdAndUpdate(documentId, {
      $inc: { 'stats.chats': 1 }
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        'stats.totalChats': 1,
        'stats.totalTokensUsed': totalTokens
      },
      $set: { 'stats.lastActive': new Date() }
    });

    res.status(201).json(chatHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update chat history (add messages)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { messages, title } = req.body;
    const chatId = req.params.id;
    const userId = req.user.id;

    const chatHistory = await ChatHistory.findOne({
      _id: chatId,
      userId,
      isActive: true
    });

    if (!chatHistory) {
      return res.status(404).json({ error: 'Chat history not found' });
    }

    // Add new messages
    const newTokens = messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);
    
    await ChatHistory.findByIdAndUpdate(chatId, {
      $push: { messages: { $each: messages } },
      $inc: { totalTokens: newTokens },
      $set: { 
        title: title || chatHistory.title,
        updatedAt: new Date()
      }
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.totalTokensUsed': newTokens },
      $set: { 'stats.lastActive': new Date() }
    });

    res.json({ message: 'Chat history updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete chat history
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;

    const chatHistory = await ChatHistory.findOne({
      _id: chatId,
      userId,
      isActive: true
    });

    if (!chatHistory) {
      return res.status(404).json({ error: 'Chat history not found' });
    }

    // Soft delete
    await ChatHistory.findByIdAndUpdate(chatId, { 
      isActive: false,
      deletedAt: new Date()
    });

    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat statistics
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await ChatHistory.aggregate([
      { $match: { userId: userId, isActive: true } },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          totalMessages: { 
            $sum: { $size: '$messages' }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalChats: 0,
      totalTokens: 0,
      totalMessages: 0
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
