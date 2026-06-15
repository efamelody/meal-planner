package com.mealplanner.recipe;

import jakarta.persistence.*;

@Entity
@Table(name = "recipes")
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String ingredients;

    @Column(nullable = false)
    private int estimatedCalories;

    public Recipe() {}

    public Recipe(String name, String ingredients, int estimatedCalories) {
        this.name = name;
        this.ingredients = ingredients;
        this.estimatedCalories = estimatedCalories;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIngredients() {
        return ingredients;
    }

    public void setIngredients(String ingredients) {
        this.ingredients = ingredients;
    }

    public int getEstimatedCalories() {
        return estimatedCalories;
    }

    public void setEstimatedCalories(int estimatedCalories) {
        this.estimatedCalories = estimatedCalories;
    }
}
