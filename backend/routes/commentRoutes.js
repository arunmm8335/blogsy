// In /backend/routes/commentRoutes.js
import express from 'express';
import {
  addComment,
  getCommentsForPost,
  deleteComment,
  toggleLikeComment,
  toggleDislikeComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addComment);
router.delete('/:id', protect, deleteComment);
router.get('/:postId', getCommentsForPost);
router.post('/:id/like', protect, toggleLikeComment);
router.post('/:id/dislike', protect, toggleDislikeComment);

export default router;