import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    text: String,
    source: {
      filename: String,
      page: Number,
      start: Number,
      end: Number,
    },
    embedding: { type: [Number], default: undefined },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    chunks: [chunkSchema],
    metadata: {
      pages: { type: Number, default: 1 },
      wordCount: { type: Number, default: 0 },
      language: { type: String, default: 'en' },
      summary: { type: String, default: '' }
    },
    stats: {
      views: { type: Number, default: 0 },
      chats: { type: Number, default: 0 },
      lastAccessed: { type: Date, default: Date.now }
    },
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
