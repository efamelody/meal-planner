package com.mealplanner.grocery;

import com.mealplanner.mealplan.MealPlan;
import com.mealplanner.mealplan.MealPlanService;
import com.mealplanner.recipe.Recipe;
import com.mealplanner.recipe.RecipeService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
public class GroceryService {

    private final MealPlanService mealPlanService;
    private final RecipeService recipeService;

    public GroceryService(MealPlanService mealPlanService, RecipeService recipeService) {
        this.mealPlanService = mealPlanService;
        this.recipeService = recipeService;
    }

    public List<String> generateGroceryList(LocalDate weekStart) {
        List<MealPlan> weekPlans = mealPlanService.getWeekPlan(weekStart);

        return weekPlans.stream()
                .map(MealPlan::getRecipe)
                .map(Recipe::getIngredients)
                .flatMap(ingredients -> Arrays.stream(ingredients.split(",")))
                .map(String::trim)
                .map(String::toLowerCase)
                .distinct()
                .sorted()
                .toList();
    }
}
