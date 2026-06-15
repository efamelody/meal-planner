import { Recipe } from './recipe.model';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export interface MealPlan {
  id: number;
  mealDate: string;
  mealType: MealType;
  recipe: Recipe;
}

export interface MealPlanRequest {
  mealDate: string;
  mealType: MealType;
  recipeId: number;
}
