const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function callOpenAI({ model, messages, temperature }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `OpenAI 요청 실패 (${response.status})`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? null;
}

// 음식 태그 생성 (gpt-3.5-turbo)
export async function generateFoodTags({ name, kcal, carbs, protein, fat, sugar }) {
  const content = await callOpenAI({
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: `음식명: ${name}, 칼로리: ${kcal}, 탄수: ${carbs}, 단백질: ${protein}, 지방: ${fat}, 당: ${sugar}`,
      },
      {
        role: 'assistant',
        content:
          '당신은 영양사입니다. 영양성분 데이터를 보고 [#고단백, #다이어트, #비건, #저탄수, #0kcal, #저당, #과일, #저지방, #고지방, #고칼로리, #고당] 중 적합한 태그를 골라 JSON 배열 형태로만 응답하세요. 예: ["#고단백"]. 해당 없으면 [] 반환.',
      },
    ],
  });

  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

// 주간 AI 리뷰 생성 (gpt-4o-mini)
export async function generateReportReview(aiPayload) {
  const content = await callOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: '당신은 사용자에게 친절하게 식단 피드백을 주는 영양사다. 응답은 반드시 JSON 객체 하나로만 반환한다.',
      },
      {
        role: 'user',
        content: `아래 리포트 데이터를 기반으로 주간 리뷰를 작성해줘.\n\n데이터: ${JSON.stringify(aiPayload)}\n\n반환 형식(JSON만):\n{\n  "review": "2문장 이내 한글 리뷰",\n  "improvementPoints": ["개선 포인트 1", "개선 포인트 2", "개선 포인트 3"],\n  "recommendedFoods": [\n    {\n      "name": "음식명",\n      "description": "추천 이유 1문장",\n      "kcal": 0,\n      "carbs": 0,\n      "protein": 0,\n      "fat": 0,\n      "sugar": 0,\n      "tags": ["#고단백"]\n    }\n  ]\n}\n\n규칙:\n- review는 과도한 과장 없이 데이터 기반으로 작성\n- improvementPoints는 정확히 3개\n- recommendedFoods는 2~3개\n- tags는 #으로 시작`,
      },
    ],
  });

  return content;
}

// 추천 음식 새로고침 (gpt-4o-mini)
export async function refreshRecommendedFoods({ aiPayload, review, improvementPoints }) {
  const content = await callOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content: '당신은 식단 추천 영양사다. 응답은 JSON 객체 하나로만 반환한다.',
      },
      {
        role: 'user',
        content: `아래 리포트 데이터를 바탕으로 추천 식단만 새로 2~3개 생성해줘.\n리뷰/개선포인트는 이미 확정되어 있으니 바꾸지 말고 추천 식단만 다양하게 바꿔줘.\n\n현재 리뷰: ${review}\n현재 개선포인트: ${JSON.stringify(improvementPoints)}\n데이터: ${JSON.stringify(aiPayload)}\n\n반환 형식(JSON만):\n{\n  "recommendedFoods": [\n    {\n      "name": "음식명",\n      "description": "추천 이유 1문장",\n      "kcal": 0,\n      "carbs": 0,\n      "protein": 0,\n      "fat": 0,\n      "sugar": 0,\n      "tags": ["#고단백"]\n    }\n  ]\n}`,
      },
    ],
  });

  return content;
}
