import express from 'express';
import {
    getUserProfileByUsername,
    updateUserProfile,
} from '../controllers/userController.js';
import { getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// This route handles getting and updating the currently logged-in user's data.
// GET /api/users/me -> Fetches user details.
// PUT /api/users/me -> Updates user profile.
router.route('/me')
  .get(protect, getMe)
  .put(
      protect, // 1. Authenticate the user
      upload.single('profilePicture'), // 2. Handle the file upload
      updateUserProfile // 3. Run the update logic
    );

// This route is for fetching ANY user's public profile by their username.
router.get('/profile/:username', getUserProfileByUsername);


export default router;