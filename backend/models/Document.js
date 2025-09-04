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
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
