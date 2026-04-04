import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    profile: {
      displayName: {
        type: String,
        default: function() { return this.name || this.email.split('@')[0]; }
      },
      avatar: {
        type: String,
        default: null // Will store base64 or URL
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      },
      bio: {
        type: String,
        maxlength: 160,
        default: ''
      },
      preferences: {
        chatStyle: {
          type: String,
          enum: ['casual', 'professional', 'technical'],
          default: 'professional'
        },
        language: {
          type: String,
          default: 'en'
        }
      }
    },
    stats: {
      documentsUploaded: { type: Number, default: 0 },
      totalChats: { type: Number, default: 0 },
      totalTokensUsed: { type: Number, default: 0 },
      joinedAt: { type: Date, default: Date.now },
      lastActive: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
