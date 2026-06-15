package com.mealplanner.recipe;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RecipeRequest(
        @NotNull @NotEmpty String name,
        @NotNull @NotEmpty List<String> ingredients
) {}
