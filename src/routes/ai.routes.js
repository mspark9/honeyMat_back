import { Router } from 'express';
import { foodTags, reportReview, recommendFoods, chat } from '../controllers/aiController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI 기반 식단 분석 및 추천
 */

/**
 * @swagger
 * /api/ai/food-tags:
 *   post:
 *     summary: 음식 태그 추출
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: 태그를 추출할 텍스트
 *     responses:
 *       200:
 *         description: 태그 추출 성공
 *       401:
 *         description: 인증 필요
 */
router.post('/food-tags', requireAuth, foodTags);

/**
 * @swagger
 * /api/ai/report-review:
 *   post:
 *     summary: AI 식단 리포트 리뷰
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportData:
 *                 type: object
 *                 description: 리뷰할 리포트 데이터
 *     responses:
 *       200:
 *         description: 리뷰 성공
 *       401:
 *         description: 인증 필요
 */
router.post('/report-review', requireAuth, reportReview);

/**
 * @swagger
 * /api/ai/recommend-foods:
 *   post:
 *     summary: AI 음식 추천
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *                 description: 사용자 선호 정보
 *     responses:
 *       200:
 *         description: 추천 성공
 *       401:
 *         description: 인증 필요
 */
router.post('/recommend-foods', requireAuth, recommendFoods);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: AI 챗봇 대화
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: 사용자 메시지
 *     responses:
 *       200:
 *         description: 응답 성공
 *       401:
 *         description: 인증 필요
 */
router.post('/chat', requireAuth, chat);

export default router;
