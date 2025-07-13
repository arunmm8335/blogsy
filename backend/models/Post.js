// In /backend/models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: {
    type: [String]
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // --- NEW FIELD FOR EFFICIENT SORTING ---
  likesCount: {
    type: Number,
    default: 0,
    index: true // This creates a database index for faster sorting on this field
  },
  // ----------------------------------------

  coverImage: { type: String, default: '' },

  // --- NEW FIELD FOR DRAFT FUNCTIONALITY ---
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published',
    index: true // Index for faster filtering
  },
  // ----------------------------------------

  media: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      fileType: { type: String, required: true },
      name: { type: String },
    }
  ],

}, {
  timestamps: true
});

// Create a text index for full-text search capabilities
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// --- NEW PRE-SAVE HOOK ---
// This middleware runs automatically every time a document is saved.
// It checks if the 'likes' array was modified and updates the count.
postSchema.pre('save', function (next) {
  if (this.isModified('likes')) {
    this.likesCount = this.likes.length;
  }
  next();
});
// -------------------------

const Post = mongoose.model('Post', postSchema);
export default Post;