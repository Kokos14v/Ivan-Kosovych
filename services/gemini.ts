
import { GoogleGenAI, Type } from "@google/genai";
import { PhotoAnalysis, NutritionData } from "../types";

// Quota and Queue State
let isGlobalQuotaExhausted = false;
let requestQueue: (() => Promise<any>)[] = [];
let activeRequests = 0;

export const setQuotaExhausted = (state: boolean) => {
  isGlobalQuotaExhausted = state;
};

export const getQuotaStatus = () => isGlobalQuotaExhausted;

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

const shouldUpgradeToPro = async () => {
  if (window.aistudio) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const isQuotaError = (error: any): boolean => {
  const msg = error?.message || error?.status || JSON.stringify(error) || '';
  const strMsg = msg.toLowerCase();
  const hit = (
    strMsg.includes('429') || 
    strMsg.includes('quota') || 
    strMsg.includes('resource_exhausted') || 
    strMsg.includes('limit reached')
  );
  if (hit) isGlobalQuotaExhausted = true;
  return hit;
};

/**
 * AI QUEUE MANAGER (V3 Parallel)
 * For Paid keys, we process up to 3 requests simultaneously.
 */
export const enqueueRequest = <T>(requestFn: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await requestFn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
    processQueue();
  });
};

const processQueue = async () => {
  if (requestQueue.length === 0) return;

  const isPaid = await shouldUpgradeToPro();
  const maxConcurrency = isPaid ? 3 : 1;
  const delayBetweenStarts = isPaid ? 200 : 3000;

  while (activeRequests < maxConcurrency && requestQueue.length > 0) {
    const task = requestQueue.shift();
    if (task) {
      activeRequests++;
      task().finally(() => {
        activeRequests--;
        processQueue();
      });
      
      if (requestQueue.length > 0 && isPaid) {
        await new Promise(r => setTimeout(r, delayBetweenStarts));
      }
    }
  }
};

/**
 * Nutrition estimation
 */
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
    return JSON.parse(response.text || "{}");
  } catch (error) {
    if (isQuotaError(error)) throw error;
    return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  }
};

/**
 * Image generation - ULTRA REALISTIC CONFIG
 */
export const generateRecipeImage = async (title: string): Promise<string> => {
  if (isGlobalQuotaExhausted) throw new Error("QUOTA_EXHAUSTED");

  const ai = getGeminiClient();
  const isPaid = await shouldUpgradeToPro();
  
  const modelToUse = isPaid ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  // Advanced Prompt for High-End Realism
  const prompt = `A hyper-realistic, high-fidelity professional food photograph of "${title}". 
    The dish is elegantly plated on artisan ceramic dinnerware. 
    Authentic food textures (steam, moisture, crispy edges), natural soft daylight from a side window, 
    shallow depth of field with a beautiful blurred background (bokeh). 
    Gourmet styling, macro details, vibrant but natural colors. 
    8k resolution, ultra-sharp focus. NO text, NO watermarks, NO artificial filters. 
    Realistic, appetizing, and sophisticated.`;
  
  try {
    const response = await ai.models.generateContent({
      model: modelToUse, 
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { 
          aspectRatio: "1:1",
          // Use 1K for perfect mobile UI balance, or upgrade to 2K for extreme detail if needed
          imageSize: isPaid ? "1K" : "1K" 
        }
      }
    });
    
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data");
  } catch (error) {
    if (isQuotaError(error)) throw error;
    throw error;
  }
};

/**
 * Photo Analysis
 */
export const analyzeMealImage = async (base64Data: string): Promise<PhotoAnalysis> => {
  const ai = getGeminiClient();
  const prompt = `Analyze this meal photo and provide details in Ukrainian. Format as JSON. Be precise about calories and portions.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 16384 },
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
    return JSON.parse(response.text || "{}");
  } catch (error) {
    if (isQuotaError(error)) throw error;
    throw error;
  }
};
