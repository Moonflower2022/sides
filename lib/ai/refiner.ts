import { GoogleGenerativeAI } from '@google/generative-ai';
import { Comparison } from '@/types/comparison';
import { generateId } from '@/lib/utils';

export async function refineComparison(
  comparison: Comparison,
  instructions: string,
  apiKey: string
): Promise<Comparison> {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `You are a comparison refinement assistant. You will receive a comparison object and instructions on how to modify it.

Current Comparison:
${JSON.stringify(comparison, null, 2)}

User Instructions:
${instructions}

Based on the instructions, modify the comparison data accordingly. You can:
- Add, remove, or modify comparison points
- Change weights/ratings of points
- Add new categories
- Rewrite point descriptions
- Add new items or remove items
- Change point types (pro/con/neutral)
- Update item descriptions

Return ONLY the complete updated comparison object as valid JSON (no markdown, no code blocks, just pure JSON) in this exact format:
{
  "id": "${comparison.id}",
  "title": "comparison title",
  "items": [
    {
      "id": "item id (keep existing IDs, generate new ones for new items)",
      "name": "Item Name",
      "description": "Brief description",
      "points": [
        {
          "id": "point id (keep existing IDs, generate new ones for new points)",
          "text": "Specific pro or con",
          "type": "pro" | "con" | "neutral",
          "weight": 1-10,
          "category": "category name"
        }
      ]
    }
  ],
  "categories": ["list", "of", "categories"],
  "userPreferences": ${JSON.stringify(comparison.userPreferences)},
  "createdAt": "${comparison.createdAt}",
  "updatedAt": "${new Date().toISOString()}"
}

Important:
- Preserve existing IDs where items/points are not removed
- Generate new IDs (using format "id_" + random string) for new items/points
- Ensure all weights are between 1-10
- Maintain the structure exactly as shown
- Update the categories list if you add new categories
- Keep the userPreferences object intact unless instructions specifically mention changing preferences
- Set updatedAt to current timestamp`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const responseText = response.text();

  // Clean up the response (remove markdown code blocks if present)
  let cleanedText = responseText.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleanedText);

  // Ensure dates are Date objects
  const updatedComparison: Comparison = {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt || new Date()),
    // Ensure all weights are within bounds
    items: parsed.items.map((item: any) => ({
      ...item,
      points: item.points.map((point: any) => ({
        ...point,
        weight: Math.max(1, Math.min(10, point.weight))
      }))
    }))
  };

  // Update category weights if new categories were added
  if (updatedComparison.userPreferences) {
    const existingCategories = new Set(
      updatedComparison.userPreferences.categoryWeights.map(cw => cw.category.toLowerCase())
    );

    const newCategoryWeights = [...updatedComparison.userPreferences.categoryWeights];

    updatedComparison.categories.forEach(category => {
      if (!existingCategories.has(category.toLowerCase())) {
        newCategoryWeights.push({
          category,
          importance: 5,
          visible: true
        });
      }
    });

    updatedComparison.userPreferences.categoryWeights = newCategoryWeights;
  }

  return updatedComparison;
}
