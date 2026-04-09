import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/summary', protect, getAnalyticsSummary);

export default router;
