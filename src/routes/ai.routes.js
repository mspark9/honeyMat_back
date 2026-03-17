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
 *               foodname:
 *                 type: string
 *                 description: 음식 이름
 *               kcal:
 *                 type: number
 *                 description: 칼로리
 *               carbs:
 *                 type: number
 *                 description: 탄수화물 (g)
 *               protein:
 *                 type: number
 *                 description: 단백질 (g)
 *               fat:
 *                 type: number
 *                 description: 지방 (g)
 *               sugar:
 *                 type: number
 *                 description: 당류 (g)
 *     responses:
 *       200:
 *         description: 태그 추출 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 foodname: { type: string }
 *                 tags: { type: array, items: { type: string } }
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
 *               profileNickname:
 *                 type: string
 *                 description: 사용자 닉네임
 *               weeklyAverageScore:
 *                 type: number
 *                 description: 주간 평균 점수
 *               scoreDiffFromLastWeek:
 *                 type: number
 *                 description: 지난 주 대비 점수 차이
 *               weeklyAverageIntake:
 *                 type: object
 *                 description: 주간 평균 영양소 섭취량
 *               nutritionGoals:
 *                 type: object
 *                 description: 영양 목표
 *     responses:
 *       200:
 *         description: 리뷰 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 review: { type: string }
 *                 improvementPoints: { type: array, items: { type: string } }
 *                 recommendedFoods: { type: array, items: { type: string } }
 *       401:
 *         description: 인증 필요
 */
router.post('/report-review', requireAuth, reportReview);

/**
 * @swagger
 * /api/ai/recommend-foods:
 *   post:
 *     summary: AI 음식 추천 갱신
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
 *               currentReview:
 *                 type: string
 *                 description: 현재 리뷰 내용
 *               weeklyAverageIntake:
 *                 type: object
 *                 description: 주간 평균 영양소 섭취량
 *               nutritionGoals:
 *                 type: object
 *                 description: 영양 목표
 *     responses:
 *       200:
 *         description: 추천 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 recommendedFoods: { type: array, items: { type: string } }
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
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 description: OpenAI 메시지 배열
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
 *               model:
 *                 type: string
 *                 default: gpt-3.5-turbo
 *               temperature:
 *                 type: number
 *                 default: 0.7
 *     responses:
 *       200:
 *         description: 응답 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content: { type: string }
 *       401:
 *         description: 인증 필요
 */
router.post('/chat', requireAuth, chat);

export default router;
