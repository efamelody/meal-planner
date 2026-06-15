package com.mealplanner.mealplan;

import com.mealplanner.recipe.Recipe;
import com.mealplanner.recipe.RecipeService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final RecipeService recipeService;

    public MealPlanService(MealPlanRepository mealPlanRepository, RecipeService recipeService) {
        this.mealPlanRepository = mealPlanRepository;
        this.recipeService = recipeService;
    }

    public List<MealPlan> getWeekPlan(LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        return mealPlanRepository.findByMealDateBetween(weekStart, weekEnd);
    }

    public MealPlan createMealPlan(MealPlanRequest request) {
        Recipe recipe = recipeService.findById(request.recipeId());
        MealPlan mealPlan = new MealPlan(request.mealDate(), request.mealType(), recipe);
        return mealPlanRepository.save(mealPlan);
    }

    public void deleteMealPlan(Long id) {
        mealPlanRepository.deleteById(id);
    }
}
