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
export async function generateFoodTags({ foodname, kcal, carbs, protein, fat, sugar }) {
  const content = await callOpenAI({
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: `음식명: ${foodname}, 칼로리: ${kcal}, 탄수: ${carbs}, 단백질: ${protein}, 지방: ${fat}, 당: ${sugar}`,
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
export async function generateReportReview({ profileNickname, weeklyAverageScore, scoreDiffFromLastWeek, weeklyAverageIntake, nutritionGoals }) {
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
        content: `아래 데이터를 기반으로 ${profileNickname}님의 주간 식단 리뷰를 작성해줘.

주간 평균 점수: ${weeklyAverageScore}점 (지난주 대비 ${scoreDiffFromLastWeek > 0 ? '+' : ''}${scoreDiffFromLastWeek}점)
주간 평균 섭취량: ${JSON.stringify(weeklyAverageIntake)}
영양 목표: ${JSON.stringify(nutritionGoals)}

반환 형식(JSON만):
{
  "review": "2문장 이내 한글 리뷰",
  "improvementPoints": ["개선 포인트 1", "개선 포인트 2", "개선 포인트 3"],
  "recommendedFoods": [
    {
      "name": "음식명",
      "description": "추천 이유 1문장",
      "kcal": 0,
      "carbs": 0,
      "protein": 0,
      "fat": 0,
      "sugar": 0,
      "tags": ["#고단백"]
    }
  ]
}

규칙:
- review는 과도한 과장 없이 데이터 기반으로 작성
- improvementPoints는 정확히 3개
- recommendedFoods는 2~3개
- tags는 #으로 시작`,
      },
    ],
  });

  return content;
}

// 추천 음식 새로고침 (gpt-4o-mini)
export async function refreshRecommendedFoods({ currentReview, weeklyAverageIntake, nutritionGoals }) {
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
        content: `아래 데이터를 바탕으로 추천 식단을 새로 2~3개 생성해줘.

현재 리뷰: ${currentReview}
주간 평균 섭취량: ${JSON.stringify(weeklyAverageIntake)}
영양 목표: ${JSON.stringify(nutritionGoals)}

반환 형식(JSON만):
{
  "recommendedFoods": [
    {
      "name": "음식명",
      "description": "추천 이유 1문장",
      "kcal": 0,
      "carbs": 0,
      "protein": 0,
      "fat": 0,
      "sugar": 0,
      "tags": ["#고단백"]
    }
  ]
}

규칙:
- recommendedFoods는 2~3개
- tags는 #으로 시작`,
      },
    ],
  });

  return content;
}
