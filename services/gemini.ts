
import { GoogleGenAI, Type } from "@google/genai";
import { PhotoAnalysis, NutritionData } from "../types";

const API_KEY = process.env.API_KEY || '';

// Global quota state as per STRICT MODE
let isGlobalQuotaExhausted = false;

export const setQuotaExhausted = (state: boolean) => {
  isGlobalQuotaExhausted = state;
};

export const getQuotaStatus = () => isGlobalQuotaExhausted;

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const isQuotaError = (error: any): boolean => {
  const msg = error?.message || error?.status || JSON.stringify(error) || '';
  const strMsg = msg.toLowerCase();
  const hit = (
    strMsg.includes('429') || 
    strMsg.includes('quota') || 
    strMsg.includes('resource_exhausted') || 
    strMsg.includes('limit reached') ||
    strMsg.includes('exhausted')
  );
  if (hit) isGlobalQuotaExhausted = true;
  return hit;
};

export const estimateRecipeNutrition = async (title: string, ingredients: string[]): Promise<NutritionData> => {
  if (isGlobalQuotaExhausted) throw new Error("QUOTA_EXHAUSTED");

  const ai = getGeminiClient();
  const prompt = `Завдання: Оціни харчову цінність (Ккал, Білки, Вуглеводи, Жири) для рецепту: ${title}. Інгредієнти: ${ingredients.join(', ')}. Розрахунок на одну порцію. Поверни лише JSON.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kcal: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER }
          },
          required: ["kcal", "protein", "carbs", "fat"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    if (isQuotaError(error)) throw error;
    console.error("Nutrition estimation failed", error);
    return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  }
};

export const generateRecipeImage = async (title: string): Promise<string> => {
  if (isGlobalQuotaExhausted) {
    throw new Error("QUOTA_EXHAUSTED");
  }

  const ai = getGeminiClient();
  // STRICT MODE: Image Content Rules (Food Only)
  const prompt = `Professional food photography of ${title}. Close-up, cinematic lighting, minimalist background, 8k resolution. SINGLE PREPARED DISH ONLY. No people, no hands, no faces, no text, no logos, no landscapes, no animals. Just the finished food on a plate or in a bowl. Highly appetizing, premium quality.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });
    
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data in response");
  } catch (error) {
    if (isQuotaError(error)) {
      isGlobalQuotaExhausted = true;
      throw error;
    }
    console.error("Image generation failed", error);
    return ""; 
  }
};

export const analyzeMealImage = async (base64Data: string): Promise<PhotoAnalysis> => {
  if (isGlobalQuotaExhausted) throw new Error("QUOTA_EXHAUSTED");

  const ai = getGeminiClient();
  const prompt = `Analyze this meal photo and provide details in Ukrainian. Format as JSON. Be precise about calories and macronutrients based on the visual portion size.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgraded for complex visual analysis
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dish_name: { type: Type.STRING },
            portion_guess: { type: Type.STRING },
            calories_kcal: { type: Type.NUMBER },
            protein_g: { type: Type.NUMBER },
            carbs_g: { type: Type.NUMBER },
            fat_g: { type: Type.NUMBER },
            health_score_0_10: { type: Type.NUMBER },
            health_label: { type: Type.STRING },
            why_short: { type: Type.STRING },
            tips: { type: Type.STRING }
          },
          required: ["dish_name", "calories_kcal", "health_score_0_10"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    if (isQuotaError(error)) throw error;
    throw error;
  }
};
