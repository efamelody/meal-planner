package com.mealplanner.recipe;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public RecipeService(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
        this.restTemplate = new RestTemplate();
    }

    public CalorieEstimation estimateCalories(RecipeRequest request) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            int total = request.ingredients().size() * 150;
            return new CalorieEstimation(total, "Rough estimate (no Gemini key configured)");
        }

        String ingredients = String.join(", ", request.ingredients());
        String prompt = "Estimate the total calories for a meal with these ingredients: " + ingredients
                + ". Respond with only JSON: {\"totalCalories\": <number>, \"summary\": \"<brief explanation>\"}";

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiApiKey;

        String requestBody = """
                {
                    "contents": [{"parts": [{"text": "%s"}]}]
                }
                """.formatted(prompt.replace("\"", "\\\""));

        try {
            String response = restTemplate.postForObject(url, requestBody, String.class);
            return parseResponse(response != null ? response : "{}");
        } catch (Exception e) {
            return new CalorieEstimation(0, "Could not reach Gemini: " + e.getMessage());
        }
    }

    public Recipe createRecipe(RecipeRequest request, int estimatedCalories) {
        Recipe recipe = new Recipe(
                request.name(),
                String.join(",", request.ingredients()),
                estimatedCalories
        );
        return recipeRepository.save(recipe);
    }

    public List<Recipe> getAllRecipes() {
        return recipeRepository.findAll();
    }

    public Recipe findById(Long id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));
    }

    private CalorieEstimation parseResponse(String response) {
        try {
            String text = response;
            if (text.contains("\"text\"")) {
                int start = text.indexOf("\"text\"") + 7;
                start = text.indexOf("\"", start) + 1;
                int end = text.indexOf("\"", start);
                String json = text.substring(start, end);

                int calStart = json.indexOf("totalCalories") + "totalCalories".length() + 2;
                int calEnd = json.indexOf(",", calStart);
                if (calEnd == -1) calEnd = json.indexOf("}", calStart);
                int calories = Integer.parseInt(json.substring(calStart, calEnd).trim());

                int sumStart = json.indexOf("summary") + "summary".length() + 3;
                int sumEnd = json.indexOf("\"", sumStart);
                String summary = json.substring(sumStart, sumEnd);

                return new CalorieEstimation(calories, summary);
            }
        } catch (Exception ignored) {}

        return new CalorieEstimation(0, "Could not estimate calories");
    }
}
