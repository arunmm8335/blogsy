// In /backend/controllers/commentController.js
import Comment from '../models/Comment.js';
import Post from '../models/Post.js'; // Keep this import
import cacheService from '../services/cacheService.js';

// @desc    Add a comment to a post
// @route   POST /api/comments
// @access  Private
export const addComment = async (req, res) => {
  // --- UPDATED to accept parentId ---
  const { postId, content, parentId } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Comment content cannot be empty.' });
  }

  try {
    // It's still good practice to ensure the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      content,
      postId,
      parentId, // <-- The new parentId is saved here
      authorId: req.user._id,
    });

    const createdComment = await comment.save();
    // Populate the author's info right away to send it back to the frontend
    await createdComment.populate('authorId', 'username profilePicture');

    // --- Cache Invalidation ---
    // Clear comments cache for this post
    await cacheService.del(`comments:post:${postId}`);
    console.log('Cache cleared for new comment');
    // -------------------------

    res.status(201).json(createdComment);

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all comments for a post
// @route   GET /api/comments/:postId
// @access  Public
export const getCommentsForPost = async (req, res) => {
  const { postId } = req.params;
  const cacheKey = `comments:post:${postId}`;

  try {
    // 1. Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return res.json(JSON.parse(cached));
    }
    console.log('Cache miss:', cacheKey);

    const comments = await Comment.find({ postId: req.params.postId })
      .populate('authorId', 'username profilePicture')
      .sort({ createdAt: 'asc' }); // Sorting by creation date is correct

    // 2. Store in cache for 5 minutes
    await cacheService.set(cacheKey, JSON.stringify(comments), 300);

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a comment (and its replies)
// @route   DELETE /api/comments/:id
// @access  Private (Author only)
export const deleteComment = async (req, res) => {
  // --- UPDATED to also delete replies recursively ---
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    // A function to find and delete all replies recursively
    const deleteReplies = async (commentId) => {
      const replies = await Comment.find({ parentId: commentId });
      for (const reply of replies) {
        await deleteReplies(reply._id); // Recursive call
      }
      await Comment.deleteMany({ parentId: commentId });
    };

    // Start the recursive deletion and delete the main comment
    await deleteReplies(req.params.id);
    await comment.deleteOne();

    // --- Cache Invalidation ---
    // Clear comments cache for this post
    await cacheService.del(`comments:post:${comment.postId}`);
    console.log('Cache cleared for comment deletion');
    // -------------------------

    res.json({ message: 'Comment and all replies removed' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Like or unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
export const toggleLikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    const userId = req.user._id;
    const hasLiked = comment.likes.includes(userId);
    if (hasLiked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
      comment.dislikes.pull(userId); // Remove dislike if present
    }
    await comment.save();

    // Clear cache for this post's comments
    await cacheService.del(`comments:post:${comment.postId}`);

    res.json({ likes: comment.likes.length, dislikes: comment.dislikes.length, liked: !hasLiked });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Dislike or undislike a comment
// @route   POST /api/comments/:id/dislike
// @access  Private
export const toggleDislikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    const userId = req.user._id;
    const hasDisliked = comment.dislikes.includes(userId);
    if (hasDisliked) {
      comment.dislikes.pull(userId);
    } else {
      comment.dislikes.push(userId);
      comment.likes.pull(userId); // Remove like if present
    }
    await comment.save();

    // Clear cache for this post's comments
    await cacheService.del(`comments:post:${comment.postId}`);

    res.json({ likes: comment.likes.length, dislikes: comment.dislikes.length, disliked: !hasDisliked });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};