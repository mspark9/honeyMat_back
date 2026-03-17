import express from "express";
import { getNotifications, readNotification, updateSettings, getSettings } from "../controllers/notificationsController.js";
import { getPattern, updatePattern } from "../controllers/mealPatternController.js";
import {
  getSettings as getNotificationTypeSettings,
  updateSettings as updateNotificationTypeSettings,
} from "../controllers/notificationTypeSettingsController.js";
import { runMealNudgeJob } from "../services/mealNudgeService.js";
import { runStreakNudgeJob } from "../services/streakNudgeService.js";
import { runInsightSugarFatJob } from "../services/insightSugarFatService.js";
import { runInsightProteinJob } from "../services/insightProteinService.js";
import { runRecommendationTomorrowJob } from "../services/recommendationTomorrowService.js";
import { runRecommendationMenuJob } from "../services/recommendationMenuService.js";
import { runWeeklyReportJob } from "../services/weeklyReportService.js";
import { runGoalAchievementJob } from "../services/goalAchievementService.js";
import { getNutritionGoals } from "../controllers/nutritionGoalsController.js";
import { getDailySummary, getDailySummaries } from "../controllers/dailySummariesController.js";
import { getTodayRecommend } from "../controllers/todayRecommendController.js";
import { runDailySummariesJob } from "../services/dailySummariesService.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

/** cron 전용: CRON_SECRET 있으면 X-Cron-Secret 헤더 일치 필요 */
const cronAuth = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers['x-cron-secret'] !== secret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};


/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: 알림 관리
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: 알림 목록 조회
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { type: object } }
 *       401:
 *         description: 인증 필요
 */
router.get("/", requireAuth, getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: 알림 읽음 처리
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 알림 ID
 *     responses:
 *       200:
 *         description: 읽음 처리 성공
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 알림 없음
 */
router.patch("/:id/read", requireAuth, readNotification);

/**
 * @swagger
 * /api/notifications/jobs/meal-nudge:
 *   post:
 *     summary: 식사 기록 유도 알림 배치 (cron 전용)
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: X-Cron-Secret
 *         schema:
 *           type: string
 *         description: CRON_SECRET 설정 시 필수
 *     responses:
 *       200:
 *         description: 배치 실행 성공
 *       401:
 *         description: 인증 실패
 */
router.post("/jobs/meal-nudge", cronAuth, async (req, res) => {
  try {
    const result = await runMealNudgeJob();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("meal-nudge job 에러:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/jobs/streak-nudge:
 *   post:
 *     summary: 연속 기록 응원 알림 배치 (cron 전용, 1일 1회 ~23:00)
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: X-Cron-Secret
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배치 실행 성공
 *       401:
 *         description: 인증 실패
 */
router.post("/jobs/streak-nudge", cronAuth, async (req, res) => {
  try {
    const result = await runStreakNudgeJob();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("streak-nudge job 에러:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/jobs/insight-sugar-fat:
 *   post:
 *     summary: 당류/지방 주의 알림 배치 (cron 전용, 14:00/20:30)
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: X-Cron-Secret
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배치 실행 성공
 *       401:
 *         description: 인증 실패
 */
router.post("/jobs/insight-sugar-fat", cronAuth, async (req, res) => {
  try {
    const result = await runInsightSugarFatJob();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("insight-sugar-fat job 에러:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/jobs/insight-protein:
 *   post:
 *     summary: 단백질 채우기 제안 알림 배치 (cron 전용, 19:00~22:00)
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: X-Cron-Secret
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배치 실행 성공
 *       401:
 *         description: 인증 실패
 */
router.post("/jobs/insight-protein", cronAuth, async (req, res) => {
  try {
    const result = await runInsightProteinJob();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("insight-protein job 에러:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/jobs/recommendation-tomorrow:
 *   post:
 *     summary: 내일의 식단 제안 알림 배치 (cron 전용, 20:00~22:00)
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: X-Cron-Secret
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배치 실행 성공
 *       401:
 *         description: 인증 실패
 */
router.post("/jobs/recommendation-tomorrow", cronAuth, async (req, res) => {
  try {
    const result = await runRecommendationTomorrowJob();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("recommendation-tomorrow job 에러:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/jobs/recommendation-menu:
 *   post:
 *     summary: 메뉴 고민 해결 알림 배치 (cron 전용, 날씨 연동, 11:00~12:00/17:00~18:00)
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: X-Cron-Secret
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배치 실행 성공
 *       401:
 *         description: 인증 실패
 */
router.post("/jobs/recommendation-menu", cronAuth, async (req, res) => {
  try {
    const result = await runRecommendationMenuJob();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("recommendation-menu job 에러:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/jobs/weekly-report:
 *   post:
 *     summary: 주간 리포트 발행 알림 배치 (cron 전용, 월요일 08:00~10:00)
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: X-Cron-Secret
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배치 실행 성공
 *       401:
 *         description: 인증 실패
 */
router.post("/jobs/weekly-report", cronAuth, async (req, res) => {
  try {
    const result = await runWeeklyReportJob();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("weekly-report job 에러:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/jobs/daily-summaries:
 *   post:
 *     summary: daily_summaries 갱신 배치 (cron 전용)
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: X-Cron-Secret
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배치 실행 성공
 *       401:
 *         description: 인증 실패
 */
router.post("/jobs/daily-summaries", cronAuth, async (req, res) => {
  try {
    const result = await runDailySummariesJob();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("daily-summaries job 에러:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/jobs/goal-achievement:
 *   post:
 *     summary: 목표 달성 축하 알림 배치 (cron 전용, 월요일 08:00~10:00)
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: X-Cron-Secret
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배치 실행 성공
 *       401:
 *         description: 인증 실패
 */
router.post("/jobs/goal-achievement", cronAuth, async (req, res) => {
  try {
    const result = await runGoalAchievementJob();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("goal-achievement job 에러:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 참고: /api/users/me/notification-settings 경로는 보통 users 라우터나 auth 라우터에 두지만, 
// 현재 알림 관련 컨트롤러로 모았으므로 /api/notifications/settings 등으로 노출하거나 
// index.js에서 /api/users 경로에 추가 매핑을 할 수 있습니다. 
// 명세서 상 /api/users/me/notification-settings 이므로 라우터에서 다음과 같이 처리할 수도 있습니다.
// 
// 하지만 일관성을 위해 index.js에서 분리하여 매핑합니다. (아래 코드는 보통 /api/users 에 연결됨)

export default router;
export const settingsRouter = express.Router();

/**
 * @swagger
 * /api/users/me/notification-settings:
 *   get:
 *     summary: 알림 수신 설정 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 설정 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     receiveNotifications: { type: boolean }
 *   put:
 *     summary: 알림 수신 설정 수정
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiveNotifications:
 *                 type: boolean
 *                 description: 알림 수신 여부
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
 *                     receiveNotifications: { type: boolean }
 */
settingsRouter.get("/me/notification-settings", requireAuth, getSettings);
settingsRouter.put("/me/notification-settings", requireAuth, updateSettings);

/**
 * @swagger
 * /api/users/me/meal-pattern:
 *   get:
 *     summary: 식사 패턴 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 식사 패턴 반환
 *   put:
 *     summary: 식사 패턴 수정
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               breakfastTime:
 *                 type: string
 *                 example: "08:00"
 *               lunchTime:
 *                 type: string
 *                 example: "12:30"
 *               dinnerTime:
 *                 type: string
 *                 example: "19:00"
 *     responses:
 *       200:
 *         description: 수정 성공
 */
settingsRouter.get("/me/meal-pattern", requireAuth, getPattern);
settingsRouter.put("/me/meal-pattern", requireAuth, updatePattern);

/**
 * @swagger
 * /api/users/me/notification-type-settings:
 *   get:
 *     summary: 알림 유형별 설정 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 유형별 설정 반환
 *   put:
 *     summary: 알림 유형별 설정 수정
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               meal_nudge:
 *                 type: object
 *                 properties:
 *                   enabled: { type: boolean }
 *                   config:
 *                     type: object
 *                     properties:
 *                       breakfastTime: { type: string, example: "08:00" }
 *                       lunchTime: { type: string, example: "12:30" }
 *                       dinnerTime: { type: string, example: "19:00" }
 *     responses:
 *       200:
 *         description: 수정 성공
 */
settingsRouter.get("/me/notification-type-settings", requireAuth, getNotificationTypeSettings);
settingsRouter.put("/me/notification-type-settings", requireAuth, updateNotificationTypeSettings);

/**
 * @swagger
 * /api/users/me/nutrition-goals:
 *   get:
 *     summary: 영양 목표 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 조회 날짜 (YYYY-MM-DD, 생략 시 오늘)
 *     responses:
 *       200:
 *         description: 영양 목표 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     date: { type: string }
 *                     targetCalories: { type: number }
 *                     targetCarbohydrate: { type: number }
 *                     targetProtein: { type: number }
 *                     targetFat: { type: number }
 *                     targetSugars: { type: number }
 */
settingsRouter.get("/me/nutrition-goals", requireAuth, getNutritionGoals);

/**
 * @swagger
 * /api/users/me/daily-summary:
 *   get:
 *     summary: 특정 날짜 일별 영양 요약 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 조회 날짜 (YYYY-MM-DD, 생략 시 오늘)
 *     responses:
 *       200:
 *         description: 일별 요약 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     date: { type: string }
 *                     calories: { type: number }
 *                     carbohydrate: { type: number }
 *                     protein: { type: number }
 *                     fat: { type: number }
 *                     sugars: { type: number }
 *                     score: { type: number }
 *                     goalAchieved: { type: boolean }
 */
settingsRouter.get("/me/daily-summary", requireAuth, getDailySummary);

/**
 * @swagger
 * /api/users/me/daily-summaries:
 *   get:
 *     summary: 날짜 범위 일별 영양 요약 조회 (주간 리포트용)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 날짜 범위 요약 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date: { type: string }
 *                       calories: { type: number }
 *                       carbohydrate: { type: number }
 *                       protein: { type: number }
 *                       fat: { type: number }
 *                       sugars: { type: number }
 *                       score: { type: number }
 *                       goalAchieved: { type: boolean }
 *       400:
 *         description: startDate 또는 endDate 누락
 */
settingsRouter.get("/me/daily-summaries", requireAuth, getDailySummaries);

/**
 * @swagger
 * /api/users/me/today-recommend:
 *   get:
 *     summary: 홈 화면용 오늘의 추천 문구 + 추천 식품 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 조회 날짜 (YYYY-MM-DD, 생략 시 오늘)
 *     responses:
 *       200:
 *         description: 오늘의 추천 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, description: 추천 한 줄 문구 }
 *                     foods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           description: { type: string }
 *                           tags: { type: array, items: { type: string } }
 *                           kcal: { type: number }
 *                           carbs: { type: number }
 *                           protein: { type: number }
 *                           fat: { type: number }
 *                           sugar: { type: number }
 *                           image: { type: string }
 */
settingsRouter.get("/me/today-recommend", requireAuth, getTodayRecommend);
