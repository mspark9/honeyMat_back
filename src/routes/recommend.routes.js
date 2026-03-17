import express from 'express';
import {
  getRandomFoodList,
  getRelatedFoodList,
  recommendFoodsByAI,
} from '../controllers/recommendController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/recommend/random:
 *   get:
 *     summary: 초기 랜덤 식단 조회
 *     tags: [Recommend]
 */
router.get('/random', getRandomFoodList);

/**
 * @swagger
 * /api/recommend/related:
 *   get:
 *     summary: 키워드로 관련 음식 검색 (접두어 제외)
 *     tags: [Recommend]
 */
router.get('/related', getRelatedFoodList);

/**
 * @swagger
 * /api/recommend/save:
 *   post:
 *     summary: AI 챗봇 식단 추천 (키워드 추출 후 DB 검색 매핑) 및 저장
 *     tags: [Recommend]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: 추천 요청 메시지
 *     responses:
 *       200:
 *         description: 추천 및 저장 성공
 *       401:
 *         description: 인증 필요
 */
// 주의: requireAuth에 의해 사용자가 로그인(토큰 존재)되어 있어야 합니다.
router.post('/save', requireAuth, recommendFoodsByAI);

export default router;
