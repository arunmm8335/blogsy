// backend/routes/authRoutes.js
import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
// --- THIS IS THE FIX ---
// Import the 'protect' middleware from its file
import { protect } from '../middleware/authMiddleware.js';
// -----------------------

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// The 'protect' middleware is now correctly imported and can be used here
router.get('/me', protect, getMe);

export default router;