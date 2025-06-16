// In /backend/controllers/commentController.js
import Comment from '../models/Comment.js';
import Post from '../models/Post.js'; // Keep this import

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
    
    res.status(201).json(createdComment);

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all comments for a post
// @route   GET /api/comments/:postId
// @access  Public
export const getCommentsForPost = async (req, res) => {
  // This function does not need to change. The frontend will build the nested tree.
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate('authorId', 'username profilePicture')
      .sort({ createdAt: 'asc' }); // Sorting by creation date is correct
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

    res.json({ message: 'Comment and all replies removed' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};