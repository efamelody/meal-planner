export interface Recipe {
  id: number;
  name: string;
  ingredients: string;
  estimatedCalories: number;
}

export interface RecipeRequest {
  name: string;
  ingredients: string[];
}

export interface CalorieEstimation {
  estimatedCalories: number;
  summary: string;
}
