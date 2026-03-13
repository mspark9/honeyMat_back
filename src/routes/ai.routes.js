import { Router } from 'express';
import { foodTags, reportReview, recommendFoods } from '../controllers/aiController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/food-tags', requireAuth, foodTags);
router.post('/report-review', requireAuth, reportReview);
router.post('/recommend-foods', requireAuth, recommendFoods);

export default router;
