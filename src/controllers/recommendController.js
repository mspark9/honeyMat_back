import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import {
  getRandomFoods,
  searchFoodsByKeywords,
  searchRelatedFoods,
  saveRecommendationResult,
} from '../models/recommendModel.js';
import { findUserById } from '../models/userModel.js';
import {
  getExcludedKeywords,
  filterFoodsByUser,
} from '../utils/allergyFilter.js';

// filter tags defined
const filterTags = [
  '#고단백',
  '#다이어트',
  '#비건',
  '#저탄수',
  '#0kcal',
  '#저당',
  '#과일',
  '#저지방',
  '#고지방',
  '#고칼로리',
  '#고당',
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * [GET] /api/recommend/random
 * 명세서 외 기존 사용 함수 (에러 방지용)
 */
export const getRandomFoodList = async (req, res) => {
  try {
    const foods = await getRandomFoods(5);
    return res.status(200).json({
      success: true,
      message: '랜덤 식단 조회 완료.',
      foods: foods.map((f) => ({
        id: String(f.id),
        name: f.name,
        calories: f.kcal,
        carbohydrates: f.carbs,
        protein: f.protein,
        fat: f.fat,
        sugar: f.sugar,
      })),
    });
  } catch (error) {
    console.error('getRandomFoodList 에러:', error);
    return res.status(500).json({ success: false, message: '서버 에러' });
  }
};

/**
 * [GET] /api/recommend/related
 */
export const getRelatedFoodList = async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
    const foods = await searchRelatedFoods(keyword, '', limit);
    return res.status(200).json({
      success: true,
      foods: foods.map((f) => ({
        id: String(f.id),
        name: f.name,
        calories: f.kcal,
        carbohydrates: f.carbs,
        protein: f.protein,
        fat: f.fat,
        sugar: f.sugar,
      })),
    });
  } catch (error) {
    console.error('getRelatedFoodList 에러:', error);
    return res.status(500).json({ success: false, message: '서버 에러' });
  }
};

/**
 * [POST] /api/chat/recommend
 * 명세서 양식 준수 (reply, foods 구조)
 */
export const recommendFoodsByAI = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: '인증 정보가 없습니다.' });
    }

    const { messages, inputMessage, userNutrients } = req.body;
    const finalInput =
      (inputMessage && inputMessage.trim()) || '추천 메뉴를 알려주세요.';

    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ success: false, message: '올바르지 않은 대화 요청입니다.' });
    }

    // 1. 사용자 컨텍스트 준비
    const user = await findUserById(userId);
    let userContext = user
      ? `목표: ${user.goals}, 제한: ${user.dietary_restrictions}, 알레르기: ${user.allergies || '없음'}`
      : '일반 건강 식단';

    if (userNutrients) {
      userContext += `, 부족영양: ${userNutrients.deficiency}, 목표: ${userNutrients.dailyGoal}, 상태: ${userNutrients.status}`;
    }

    // 2. 프롬프트 설정 (태그 및 특수문자 제거)
    const promptMessages = [
      {
        role: 'system',
        content: `당신은 전문 영양사입니다. 사용자의 건강 목표에 맞춰 영양적으로 균형 잡힌 한국 식단을 추천하세요.
[응답 규칙]
1. 모든 대화는 한국어로 진행하며 친절하게 설명하세요.
2. 추천하는 구체적인 메뉴 데이터는 반드시 답변 마지막에 [DATA]와 [/DATA] 태그로 감싸서 JSON 배열 형식으로 포함하세요.
3. JSON 구조: [{"name": "음식명", "description": "설명", "tags": ["태그1", "태그2"]}]
4. tags는 반드시 다음 목록에서만 선택하세요: ${filterTags.join(', ')}.
5. 한 번에 3~5개의 메뉴를 추천하고 실제 음식 DB에서 검색 가능한 메뉴명을 사용하세요.
6. 추천된 메뉴는 중복되지 않도록 하세요.
7. 없는 식단을 만들어내지 마세요.
8. 텍스트 답변에서는 특수문자 *, &, ^, %, $, #, @, ;를 출력하지 마세요.
9. 답변 양식: 간단한 설명 후 번호. 메뉴이름: 추천이유 순서로 작성하고 마지막에 카드 확인 권유 문구를 넣으세요.
[영양 기준] 추천 음식은 반드시 아래 기준을 충족해야 합니다:
- 1회 제공량 기준 칼로리 600kcal 이하
- 단백질 5g 이상
- 당류 30g 이하
- 포화지방 10g 이하
- 피자, 햄버거, 치킨, 라면, 과자, 케이크 등 고칼로리 가공식품은 절대 추천하지 마세요.
[사용자정보] ${userContext}`,
      },
      ...messages
        .filter(
          (m) =>
            m.content &&
            typeof m.content === 'string' &&
            m.content.trim() !== '',
        )
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: finalInput },
    ];

    // 3. AI 응답 생성
    let aiResponseContent = '';
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: promptMessages,
        temperature: 0.3,
      });
      aiResponseContent = completion.choices[0].message.content;
    } else {
      aiResponseContent =
        '식단을 추천합니다. [DATA][{"name": "닭가슴살", "description": "고단백"}][/DATA]';
    }

    // 4. [DATA] 파싱 및 텍스트 정제
    const dataRegex = /\[DATA\]([\s\S]*?)\[\/DATA\]/;
    const match = aiResponseContent.match(dataRegex);
    let searchKeywords = [];
    const cleanTextMessage = aiResponseContent
      .replace(dataRegex, '')
      .replace(/[#*]/g, '')
      .trim();

    if (match && match[1]) {
      try {
        const parsedData = JSON.parse(match[1]);
        searchKeywords = parsedData
          .map((item) => item.name.trim())
          .filter(Boolean);
      } catch (e) {
        console.error('JSON 파싱 에러:', e);
      }
    }

    // 5. DB 검색 및 중복 제거
    let rawFoods = await searchFoodsByKeywords(searchKeywords);
    const uniqueFoodsMap = new Map();
    rawFoods.forEach((f) => {
      if (!uniqueFoodsMap.has(f.name)) uniqueFoodsMap.set(f.name, f);
    });

    let recommendedFoods = searchKeywords
      .map((name) => uniqueFoodsMap.get(name))
      .filter(Boolean);

    // 영양 기준 필터 (칼로리 ≤600, 단백질 ≥5, 당류 ≤30)
    const isHealthy = (f) =>
      f.kcal != null && f.kcal <= 600 &&
      f.protein != null && f.protein >= 5 &&
      f.sugar != null && f.sugar <= 30;
    recommendedFoods = recommendedFoods.filter(isHealthy);

    if (recommendedFoods.length === 0) {
      recommendedFoods = await getRandomFoods(3);
    }

    // 6. 필터링 및 명세서 양식 매핑
    const excluded = getExcludedKeywords(user || {});
    recommendedFoods = filterFoodsByUser(recommendedFoods, excluded).slice(
      0,
      5,
    );

    const responseFoodsList = recommendedFoods.map((f) => ({
      id: String(f.id),
      name: f.name,
      calories: f.kcal,
      carbohydrates: f.carbs,
      protein: f.protein,
      fat: f.fat,
      sugar: f.sugar,
    }));

    // 7. 저장
    await saveRecommendationResult(
      uuidv4(),
      userId,
      responseFoodsList,
      cleanTextMessage,
    );

    // 8. 반환 (reply 필드명 준수)
    return res.status(200).json({
      success: true,
      reply: cleanTextMessage,
      recommendedNames: searchKeywords,
      foods: responseFoodsList,
    });
  } catch (error) {
    console.error('recommendFoodsByAI 에러:', error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
};