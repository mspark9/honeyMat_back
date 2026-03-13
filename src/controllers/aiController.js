import OpenAI from 'openai';
import {
  generateFoodTags,
  generateReportReview,
  refreshRecommendedFoods,
} from '../services/aiService.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chat(req, res) {
  try {
    const { messages, model = 'gpt-3.5-turbo', temperature = 0.7 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'messages 배열이 필요합니다.' });
    }

    const completion = await openai.chat.completions.create({ model, messages, temperature });
    const content = completion.choices[0].message.content;

    res.json({ content });
  } catch (error) {
    console.error('chat error:', error);
    res.status(500).json({ message: error.message });
  }
}

export async function foodTags(req, res) {
  try {
    const { name, kcal, carbs, protein, fat, sugar } = req.body;
    const tags = await generateFoodTags({ name, kcal, carbs, protein, fat, sugar });
    res.json({ tags });
  } catch (error) {
    console.error('foodTags error:', error);
    res.status(500).json({ message: error.message });
  }
}

export async function reportReview(req, res) {
  try {
    const aiPayload = req.body;
    const content = await generateReportReview(aiPayload);
    res.json({ content });
  } catch (error) {
    console.error('reportReview error:', error);
    res.status(500).json({ message: error.message });
  }
}

export async function recommendFoods(req, res) {
  try {
    const { aiPayload, review, improvementPoints } = req.body;
    const content = await refreshRecommendedFoods({ aiPayload, review, improvementPoints });
    res.json({ content });
  } catch (error) {
    console.error('recommendFoods error:', error);
    res.status(500).json({ message: error.message });
  }
}
