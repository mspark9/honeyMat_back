import {
  generateFoodTags,
  generateReportReview,
  refreshRecommendedFoods,
} from '../services/aiService.js';

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
