import express from "express";
import userController from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { uploadProfileImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and management
 */
// test
/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nickname
 *             properties:
 *               email:
 *                 type: string
 *                 description: 이메일 (필수)
 *               password:
 *                 type: string
 *                 description: 비밀번호 (필수)
 *               nickname:
 *                 type: string
 *                 description: 닉네임 (필수)
 *               profile_image:
 *                 type: string
 *                 format: binary
 *                 description: 프로필 이미지 (선택)
 *               gender:
 *                 type: string
 *                 description: 성별 (선택)
 *               age_group:
 *                 type: string
 *                 description: 연령대 (선택)
 *               height:
 *                 type: number
 *                 description: 키 (선택)
 *               weight:
 *                 type: number
 *                 description: 몸무게 (선택)
 *               goals:
 *                 type: string
 *                 description: 목표 (JSON 배열 문자열, 선택)
 *               dietary_restrictions:
 *                 type: string
 *                 description: 식이 제한 (JSON 배열 문자열, 선택)
 *               receive_notifications:
 *                 type: boolean
 *                 description: 알림 수신 여부 (선택)
 *               eating_habits:
 *                 type: string
 *                 description: 식습관 (선택)
 *               allergies:
 *                 type: string
 *                 description: 알레르기 (선택)
 *     responses:
 *       201:
 *         description: 회원가입 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     email: { type: string }
 *                     nickname: { type: string }
 *                     profileImageUrl: { type: string }
 *                     gender: { type: string }
 *                     ageGroup: { type: string }
 *                     height: { type: number }
 *                     weight: { type: number }
 *                     goals: { type: array, items: { type: string } }
 *                     dietaryRestrictions: { type: array, items: { type: string } }
 *                     receiveNotifications: { type: boolean }
 *                     eatingHabits: { type: string }
 *                     allergies: { type: string }
 *                     createdAt: { type: string, format: date-time }
 *       400:
 *         description: 필수 입력값 누락
 *       409:
 *         description: 이미 사용 중인 이메일
 */
router.post("/register", uploadProfileImage.single("profile_image"), userController.signup);
router.post("/signup", uploadProfileImage.single("profile_image"), userController.signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 (accessToken 반환, refreshToken은 쿠키로 설정)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 token: { type: string, description: Access Token }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     email: { type: string }
 *                     nickname: { type: string }
 *                     height: { type: number }
 *                     weight: { type: number }
 *                     goals: { type: array, items: { type: string } }
 *                     dietaryRestrictions: { type: array, items: { type: string } }
 *       401:
 *         description: 이메일 또는 비밀번호 불일치
 */
router.post("/login", userController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", userController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", userController.logout);

/**
 * @swagger
 * /api/auth/forgot-password/send-code:
 *   post:
 *     summary: 비밀번호 찾기 - 인증 코드 이메일 발송
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: 인증 코드 발송 성공
 *       404:
 *         description: 가입되지 않은 이메일
 * /api/auth/forgot-password/verify-code:
 *   post:
 *     summary: 인증 코드 검증 (resetToken 반환)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *                 description: 6자리 인증 코드
 *     responses:
 *       200:
 *         description: 인증 성공 (resetToken 반환)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 resetToken: { type: string }
 *       400:
 *         description: 코드 불일치 또는 만료
 * /api/auth/forgot-password/reset-password:
 *   post:
 *     summary: 새 비밀번호 설정
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *       400:
 *         description: 유효하지 않은 토큰 또는 만료
 * /api/auth/forgot-password/resend-code:
 *   post:
 *     summary: 인증 코드 재발송
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: 재발송 성공
 */
router.post("/forgot-password/send-code", userController.sendPasswordResetCode);
router.post("/forgot-password/verify-code", userController.verifyPasswordResetCode);
router.post("/forgot-password/reset-password", userController.resetPassword);
router.post("/forgot-password/resend-code", userController.resendPasswordResetCode);


/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 사용자 프로필 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     nickname: { type: string }
 *                     profileImageUrl: { type: string }
 *                     gender: { type: string }
 *                     ageGroup: { type: string }
 *                     height: { type: number }
 *                     weight: { type: number }
 *                     goals: { type: array, items: { type: string } }
 *                     dietaryRestrictions: { type: array, items: { type: string } }
 *       401:
 *         description: 인증 필요
 */
router.get("/me", requireAuth, userController.getMyProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: 사용자 정보 수정
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname: { type: string }
 *               profileImageUrl: { type: string }
 *               height: { type: number }
 *               weight: { type: number }
 *               goals:
 *                 type: array
 *                 items: { type: string }
 *               dietaryRestrictions:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     nickname: { type: string }
 *                     profileImageUrl: { type: string }
 *                     height: { type: number }
 *                     weight: { type: number }
 *                     goals: { type: array, items: { type: string } }
 *                     dietaryRestrictions: { type: array, items: { type: string } }
 *       401:
 *         description: 인증 필요
 */
router.put("/profile", requireAuth, userController.updateMyProfile);

/**
 * @swagger
 * /api/auth/profile/image:
 *   post:
 *     summary: 사용자 프로필 이미지 업로드
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 프로필 이미지 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profileImage:
 *                   type: string
 *                   example: "/uploads/profile/user_123_1234567890.jpg"
 */
router.post("/profile/image", requireAuth, uploadProfileImage.single("profileImage"), userController.uploadProfileImageHandler);

/**
 * @swagger
 * /api/auth/profile/image:
 *   delete:
 *     summary: 사용자 프로필 이미지 삭제
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 프로필 이미지 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "프로필 이미지가 삭제되었습니다."
 */
router.delete("/profile/image", requireAuth, userController.deleteProfileImageHandler);

/**
 * @swagger
 * /api/auth/withdraw:
 *   delete:
 *     summary: 회원탈퇴 (접속 불가 처리)
 *     tags: [Auth]
 */
router.delete("/withdraw", requireAuth, userController.withdrawUser);

router.get("/login", (req, res) => {
    res.send("login endpoint alive. Use POST.");
});

router.get("/signup", (req, res) => {
    res.send("signup endpoint alive. Use POST.");
});

router.get("/cookie-test", (req, res) => {
    res.json({ cookies: req.cookies });
});

export default router;