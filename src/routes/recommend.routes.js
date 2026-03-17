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
 * tags:
 *   name: Recommend
 *   description: 식단 추천
 */

/**
 * @swagger
 * /api/recommend/random:
 *   get:
 *     summary: 초기 랜덤 식단 5개 조회
 *     tags: [Recommend]
 *     responses:
 *       200:
 *         description: 랜덤 식품 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 foods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       image: { type: string }
 *                       kcal: { type: number }
 *                       carbs: { type: number }
 *                       protein: { type: number }
 *                       fat: { type: number }
 *                       sugar: { type: number }
 *                       status: { type: string }
 */
router.get('/random', getRandomFoodList);

/**
 * @swagger
 * /api/recommend/related:
 *   get:
 *     summary: 키워드로 관련 음식 검색 (접두어 제외)
 *     tags: [Recommend]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 검색 키워드
 *       - in: query
 *         name: exclude
 *         schema:
 *           type: string
 *         description: 제외할 접두어
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 20
 *         description: 결과 개수 (최대 20)
 *     responses:
 *       200:
 *         description: 관련 식품 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 foods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       image: { type: string }
 *                       kcal: { type: number }
 *                       carbs: { type: number }
 *                       protein: { type: number }
 *                       fat: { type: number }
 *                       sugar: { type: number }
 *                       status: { type: string }
 */
router.get('/related', getRelatedFoodList);

/**
 * @swagger
 * /api/recommend/save:
 *   post:
 *     summary: AI 챗봇 식단 추천 및 저장
 *     tags: [Recommend]
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
 *                 description: 대화 히스토리 배열
 *                 items:
 *                   type: object
 *                   properties:
 *                     role: { type: string, enum: [user, assistant] }
 *                     content: { type: string }
 *               inputMessage:
 *                 type: string
 *                 description: 현재 사용자 입력 메시지 (생략 시 "추천 메뉴를 알려주세요.")
 *     responses:
 *       200:
 *         description: 추천 및 저장 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 chatContent: { type: string, description: AI 텍스트 응답 }
 *                 foods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       image: { type: string }
 *                       kcal: { type: number }
 *                       carbs: { type: number }
 *                       protein: { type: number }
 *                       fat: { type: number }
 *                       sugar: { type: number }
 *       401:
 *         description: 인증 필요
 */
// 주의: requireAuth에 의해 사용자가 로그인(토큰 존재)되어 있어야 합니다.
router.post('/save', requireAuth, recommendFoodsByAI);

export default router;
