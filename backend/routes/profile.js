import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import ChatHistory from '../models/ChatHistory.js';

const router = Router();

// Get user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get additional stats
    const [documentCount, chatCount] = await Promise.all([
      Document.countDocuments({ userId: req.user.id, isActive: true }),
      ChatHistory.countDocuments({ userId: req.user.id, isActive: true })
    ]);

    // Get recent activity
    const recentDocuments = await Document.find({ 
      userId: req.user.id, 
      isActive: true 
    })
    .select('originalName createdAt stats.views')
    .sort({ createdAt: -1 })
    .limit(3);

    const recentChats = await ChatHistory.find({ 
      userId: req.user.id, 
      isActive: true 
    })
    .populate('documentId', 'originalName')
    .select('title updatedAt totalTokens')
    .sort({ updatedAt: -1 })
    .limit(3);

    const profileData = {
      ...user.toObject(),
      stats: {
        ...user.stats,
        documentsUploaded: documentCount,
        totalChats: chatCount
      },
      recentActivity: {
        documents: recentDocuments,
        chats: recentChats
      }
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get document statistics
    const documents = await Document.find({ userId: req.user.id, isActive: true });
    const totalDocuments = documents.length;
    const totalViews = documents.reduce((sum, doc) => sum + (doc.stats?.views || 0), 0);
    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);

    // Get chat statistics
    const chats = await ChatHistory.find({ userId: req.user.id, isActive: true });
    const totalChats = chats.length;
    const totalTokens = chats.reduce((sum, chat) => sum + (chat.totalTokens || 0), 0);

    // Get activity over last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDocuments = await Document.find({
      userId: req.user.id,
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    const recentChats = await ChatHistory.find({
      userId: req.user.id,
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    // Format analytics data
    const analytics = {
      overview: {
        totalDocuments,
        totalChats,
        totalViews,
        totalTokens,
        storageUsed: totalSize
      },
      activity: {
        documentsThisMonth: recentDocuments.length,
        chatsThisMonth: recentChats.length,
        dailyActivity: getDailyActivity(recentDocuments, recentChats)
      },
      documents: {
        mostViewed: documents
          .sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0))
          .slice(0, 5)
          .map(doc => ({
            name: doc.originalName,
            views: doc.stats?.views || 0,
            size: doc.size,
            createdAt: doc.createdAt
          })),
        recent: recentDocuments.slice(0, 5).map(doc => ({
          name: doc.originalName,
          views: doc.stats?.views || 0,
          size: doc.size,
          createdAt: doc.createdAt
        }))
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Helper function to get daily activity
function getDailyActivity(documents, chats) {
  const activity = {};
  const last7Days = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last7Days.push(dateStr);
    activity[dateStr] = { documents: 0, chats: 0 };
  }
  
  documents.forEach(doc => {
    const dateStr = doc.createdAt.toISOString().split('T')[0];
    if (activity[dateStr]) {
      activity[dateStr].documents++;
    }
  });
  
  chats.forEach(chat => {
    const dateStr = chat.createdAt.toISOString().split('T')[0];
    if (activity[dateStr]) {
      activity[dateStr].chats++;
    }
  });
  
  return last7Days.map(date => ({
    date,
    documents: activity[date].documents,
    chats: activity[date].chats
  }));
}

// Update user profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { profile } = req.body;
    const userId = req.user.id;

    // Validate input
    if (profile.bio && profile.bio.length > 160) {
      return res.status(400).json({ error: 'Bio must be 160 characters or less' });
    }

    const allowedFields = {
      'profile.displayName': profile.displayName,
      'profile.bio': profile.bio,
      'profile.theme': profile.theme,
      'profile.preferences.chatStyle': profile.preferences?.chatStyle,
      'profile.preferences.language': profile.preferences?.language,
      'stats.lastActive': new Date()
    };

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: allowedFields },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload/Update avatar
router.post('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ error: 'Valid avatar data required' });
    }

    // Basic validation for base64 image
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Avatar must be a valid image' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        'profile.avatar': avatar,
        'stats.lastActive': new Date()
      }
    });

    res.json({ message: 'Avatar updated successfully', avatar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Document upload trend
    const documentTrend = await Document.aggregate([
      { 
        $match: { 
          userId: userId, 
          isActive: true,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Chat activity trend
    const chatTrend = await ChatHistory.aggregate([
      { 
        $match: { 
          userId: userId, 
          isActive: true,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          tokens: { $sum: '$totalTokens' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Most used documents
    const topDocuments = await Document.aggregate([
      { $match: { userId: userId, isActive: true } },
      { $sort: { 'stats.views': -1, 'stats.chats': -1 } },
      { $limit: 5 },
      {
        $project: {
          originalName: 1,
          'stats.views': 1,
          'stats.chats': 1,
          createdAt: 1
        }
      }
    ]);

    res.json({
      trends: {
        documents: documentTrend,
        chats: chatTrend
      },
      topDocuments,
      period: '30 days'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
