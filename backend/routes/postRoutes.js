import express from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  searchPosts,
  getUserDrafts,
  publishDraft,
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// This route correctly handles multiple files for CREATING a post
router.route('/')
  .get(getAllPosts)
  .post(protect, upload.array('media', 10), createPost);

// The '/search' route is correctly placed before '/:id'
router.route('/search').get(searchPosts);

// Draft routes
router.route('/drafts').get(protect, getUserDrafts);

router.route('/:id')
  .get(getPostById)
  // --- THIS IS THE FIX ---
  // Change upload.single() to upload.array() to allow multiple files for UPDATING a post
  .put(protect, upload.array('media', 10), updatePost)
  // -----------------------
  .delete(protect, deletePost);

router.route('/:id/like').put(protect, toggleLikePost);

// Publish draft route
router.route('/:id/publish').put(protect, publishDraft);

export default router;