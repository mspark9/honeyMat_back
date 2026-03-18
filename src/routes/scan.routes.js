import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import s3 from '../config/s3.js';
import * as scanController from '../controllers/scanController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// AI 분석용 (메모리 - base64로 OpenAI 전달)
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('JPEG, PNG, WebP만 업로드 가능합니다.'), false);
  },
});

// save-ai용: S3 버킷에 저장, DB에는 S3 URL 저장
const uploadDisk = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `scans/scan-${uniqueSuffix}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('JPEG, PNG, WebP만 업로드 가능합니다.'), false);
  },
});

// multer 에러(확장자 불일치 등)를 콘솔 폭탄 없이 JSON 400으로 처리
function upload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  };
}

/**
 * @swagger
 * tags:
 *   name: Scan
 *   description: 음식 이미지 AI 스캔 및 분석
 */

/**
 * @swagger
 * /api/scan/food:
 *   post:
 *     summary: 음식 이미지 AI 분석
 *     tags: [Scan]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 분석할 음식 이미지 (JPEG, PNG, WebP, 최대 10MB)
 *     responses:
 *       200:
 *         description: AI 분석 결과 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 imageUrl: { type: string }
 *                 totalCalories: { type: number }
 *                 foods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name: { type: string }
 *                       amount: { type: number, description: 추정 g }
 *                       bbox:
 *                         type: object
 *                         properties:
 *                           x: { type: number }
 *                           y: { type: number }
 *                           w: { type: number }
 *                           h: { type: number }
 *                       calories: { type: number }
 *                       carbohydrate: { type: number }
 *                       protein: { type: number }
 *                       fat: { type: number }
 *                       sodium: { type: number }
 *                       sugars: { type: number }
 *       400:
 *         description: 이미지 없음 또는 형식 오류
 */
router.post('/food', upload(uploadDisk.single('image')), scanController.analyzeFood);

/**
 * @swagger
 * /api/scan/food/reanalyze:
 *   post:
 *     summary: 수정된 음식량으로 AI 재분석
 *     tags: [Scan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foods
 *             properties:
 *               foods:
 *                 type: array
 *                 description: 재분석할 음식 목록
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string, description: 음식명 }
 *                     amount: { type: number, description: 그램수 }
 *     responses:
 *       200:
 *         description: 재분석 결과 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 totalCalories: { type: number }
 *                 foods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name: { type: string }
 *                       amount: { type: number }
 *                       calories: { type: number }
 *                       carbohydrate: { type: number }
 *                       protein: { type: number }
 *                       fat: { type: number }
 *                       sodium: { type: number }
 *                       sugars: { type: number }
 *       400:
 *         description: foods 배열 없음
 */
router.post('/food/reanalyze', express.json(), scanController.reanalyzeFood);

/**
 * @swagger
 * /api/scan/save-diary:
 *   post:
 *     summary: AI 분석 결과를 식단 다이어리에 저장
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 음식 이미지 (이미지만 보내면 AI 자동 분석)
 *               scan_result:
 *                 type: string
 *                 description: AI 분석 결과 JSON 문자열 (image와 함께 전송 시 ai_scans에 저장)
 *               foods:
 *                 type: string
 *                 description: 저장할 음식 목록 JSON 문자열 ([{name, amount, calories, ...}])
 *               ai_scan_id:
 *                 type: string
 *                 description: 기존 AI 스캔 ID
 *               meal_type:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *                 description: 식사 유형 (생략 시 현재 시간 기준 자동 설정)
 *               mealTime:
 *                 type: string
 *                 format: date-time
 *               image_url:
 *                 type: string
 *                 description: 이미지 URL (파일 대신 URL로 전달 시 사용)
 *     responses:
 *       200:
 *         description: 다이어리 저장 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 ai_scan_id: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     meal_type: { type: string }
 *                     mealTime: { type: string }
 *                     foods: { type: array }
 *       401:
 *         description: 인증 필요
 *       400:
 *         description: 저장할 음식 정보 없음
 */
// router.post('/save-ai', requireAuth, uploadDisk.single('image'), scanController.saveAi);
router.post('/save-diary', requireAuth, upload(uploadDisk.single('image')), scanController.saveDiary);

export default router;
