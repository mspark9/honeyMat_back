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
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 분석할 음식 이미지 (JPEG, PNG, WebP, 최대 10MB)
 *     responses:
 *       200:
 *         description: AI 분석 결과 반환
 *       400:
 *         description: 이미지 없음 또는 형식 오류
 */
router.post('/food', uploadDisk.single('image'), scanController.analyzeFood);

/**
 * @swagger
 * /api/scan/food/reanalyze:
 *   post:
 *     summary: 음식 AI 재분석
 *     tags: [Scan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scanResult:
 *                 type: object
 *                 description: 기존 스캔 결과 데이터
 *     responses:
 *       200:
 *         description: 재분석 결과 반환
 *       400:
 *         description: 잘못된 요청
 */
router.post('/food/reanalyze', express.json(), scanController.reanalyzeFood);

/**
 * @swagger
 * /api/scan/save-diary:
 *   post:
 *     summary: AI 분석 결과를 다이어리에 저장
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
 *                 description: 음식 이미지 (JPEG, PNG, WebP, 최대 10MB)
 *               scan_result:
 *                 type: string
 *                 description: AI 분석 결과 JSON 문자열
 *     responses:
 *       200:
 *         description: 다이어리 저장 성공
 *       401:
 *         description: 인증 필요
 */
// router.post('/save-ai', requireAuth, uploadDisk.single('image'), scanController.saveAi);
router.post('/save-diary', requireAuth, uploadDisk.single('image'), scanController.saveDiary);

export default router;
