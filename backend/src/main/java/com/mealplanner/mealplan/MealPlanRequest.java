package com.mealplanner.mealplan;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record MealPlanRequest(
        @NotNull LocalDate mealDate,
        @NotNull MealType mealType,
        @NotNull Long recipeId
) {}
