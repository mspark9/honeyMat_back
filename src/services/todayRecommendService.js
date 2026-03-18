/**
 * 홈 화면용 오늘의 추천 한 줄 문구 (규칙 기반)
 * daily_summary + nutrition_goals 기반
 */
import { summarizeDay } from './dailySummariesService.js';
import { getOrCreateGoals } from '../models/nutritionGoalsModel.js';

const MIN_PROTEIN_DEFICIT = 15;  // 15g 이상 부족 시
const EXCEED_RATIO = 1.2;        // 목표의 120% 초과 시
const GOOD_SCORE = 80;           // 80점 이상이면 양호

// 로그인마다 새 메시지를 보여주기 위한 인메모리 캐시
// key: `${userId}:${dateStr}`, value: string
const messageCache = new Map();

/**
 * 로그인 시 해당 유저의 메시지 캐시를 초기화
 * @param {string} userId
 */
export function clearTodayMessageCache(userId) {
  for (const key of messageCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      messageCache.delete(key);
    }
  }
}

/**
 * 오늘의 추천 한 줄 문구 생성
 * @param {string} userId
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Promise<string>}
 */
export async function getTodayMessage(userId, dateStr) {
  const cacheKey = `${userId}:${dateStr}`;
  if (messageCache.has(cacheKey)) {
    return messageCache.get(cacheKey);
  }

  const [summary, goals] = await Promise.all([
    summarizeDay(userId, dateStr),
    getOrCreateGoals(userId, dateStr),
  ]);

  const actual = {
    calories: Number(summary?.total_calories) || 0,
    protein: Number(summary?.total_protein) || 0,
    sugars: Number(summary?.total_sugars) || 0,
    fat: Number(summary?.total_fat) || 0,
  };

  const target = {
    calories: Number(goals?.target_calories) || 2000,
    protein: Number(goals?.target_protein) || 50,
    sugars: Number(goals?.target_sugars) || 50,
    fat: Number(goals?.target_fat) || 65,
  };

  const score = Number(summary?.score) ?? 0;

  // 0. 오늘 식사 기록 없음
  if (actual.calories === 0 && actual.protein === 0) {
    return '오늘 아직 식사 기록이 없어요. 첫 끼니를 기록해 보세요! 🍽️';
  }

  const candidates = [];

  // 1. 단백질 부족
  const proteinDeficit = target.protein - actual.protein;
  if (proteinDeficit >= MIN_PROTEIN_DEFICIT) {
    candidates.push(
      `오늘 목표 단백질까지 ${Math.round(proteinDeficit)}g 남았어요! 간식으로 삶은 계란이나 두유 어떠세요? 💪`,
      `단백질이 조금 부족해요. 닭가슴살이나 그릭요거트로 채워보는 건 어떨까요? 🥚`,
      `오늘 단백질 ${Math.round(proteinDeficit)}g 더 드셔야 해요! 두부나 견과류 간식 추천드려요. 🥜`,
      `단백질 보충 시간이에요! 고단백 간식 하나 챙겨보세요. 🍗`,
    );
  }

  // 2. 당류·지방 과다
  const overSugars = target.sugars > 0 && actual.sugars >= target.sugars * EXCEED_RATIO;
  const overFat = target.fat > 0 && actual.fat >= target.fat * EXCEED_RATIO;
  if (overSugars && overFat) {
    candidates.push(
      '오늘 당류·지방을 조금 많이 드셨어요. 내일은 담백한 식단 어떠세요? 🥗',
      '당류와 지방이 목표를 넘었어요. 저녁은 가볍게 드시는 건 어떨까요? 🥦',
    );
  } else if (overSugars) {
    candidates.push(
      '오늘 당류를 조금 많이 드셨어요. 내일은 담백한 식단 어떠세요? 🥗',
      '당류 섭취가 높아요. 물 한 잔으로 마무리해 보세요! 💧',
    );
  } else if (overFat) {
    candidates.push(
      '오늘 지방을 조금 많이 드셨어요. 내일은 담백한 식단 어떠세요? 🥗',
      '지방 섭취가 목표를 넘었어요. 가벼운 산책도 도움이 돼요! 🚶',
    );
  }

  // 3. 칼로리 부족 (목표의 70% 미만)
  if (target.calories > 0 && actual.calories < target.calories * 0.7) {
    candidates.push(
      '오늘 칼로리가 부족해요. 영양 가득한 간식 어떠세요? 🍎',
      '에너지가 부족할 수 있어요. 균형 잡힌 식사 한 번 더 챙겨보세요! 🍱',
    );
  }

  // 4. 전반적으로 양호
  if (score >= GOOD_SCORE) {
    candidates.push(
      '오늘도 균형 잡힌 식사 잘 하고 계시네요! 👍',
      '완벽한 식단이에요! 이 페이스 유지해 보세요. 🌟',
      '오늘 영양 관리 훌륭해요! 내일도 파이팅! 🎉',
    );
  }

  // 후보가 있으면 랜덤 선택, 없으면 기본 메시지
  const message = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : '오늘 메뉴 고민되시죠? AI가 맛있는 식단을 추천해 드릴게요! 🍽️';

  messageCache.set(cacheKey, message);
  return message;
}
