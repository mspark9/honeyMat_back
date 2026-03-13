import { Router } from 'express';
import { foodTags, reportReview, recommendFoods, chat } from '../controllers/aiController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/food-tags', requireAuth, foodTags);
router.post('/report-review', requireAuth, reportReview);
router.post('/recommend-foods', requireAuth, recommendFoods);
router.post('/chat', requireAuth, chat);

export default router;
