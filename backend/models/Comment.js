// In /backend/models/Comment.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },

  // --- THIS IS THE NEW FIELD ---
  // It will be null for top-level comments and will contain the ID of
  // the parent comment for any replies.
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment', // It references another comment in the same collection
    default: null, // Default to null, making it a top-level comment
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: [],
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: [],
  }],

}, {
  // Use the full timestamps object to get both createdAt and updatedAt
  timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;