package com.mealplanner.recipe;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(recipeService.getAllRecipes());
    }

    @PostMapping
    public ResponseEntity<Recipe> createRecipe(@Valid @RequestBody RecipeRequest request) {
        CalorieEstimation estimation = recipeService.estimateCalories(request);
        Recipe saved = recipeService.createRecipe(request, estimation.estimatedCalories());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/estimate-calories")
    public ResponseEntity<CalorieEstimation> estimateCalories(@Valid @RequestBody RecipeRequest request) {
        CalorieEstimation estimation = recipeService.estimateCalories(request);
        return ResponseEntity.ok(estimation);
    }
}
