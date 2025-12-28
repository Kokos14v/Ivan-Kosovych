
export type Category = 'Сніданки' | 'Обіди' | 'Вечері' | 'Перекуси';

export interface NutritionData {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  title: string;
  category: Category;
  ingredients: string[];
  instructions: string[];
  image?: string;
  nutrition?: NutritionData;
}

export interface PhotoAnalysis {
  dish_name: string;
  portion_guess: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  health_score_0_10: number;
  health_label: string;
  why_short: string;
  tips: string;
}
