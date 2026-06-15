import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RecipeService } from '../../services/recipe.service';
import { Recipe, CalorieEstimation } from '../../models/recipe.model';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatListModule, MatChipsModule, MatIconModule
  ],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.css'
})
export class RecipesComponent implements OnInit {
  recipes: Recipe[] = [];
  name = '';
  ingredientInput = '';
  ingredients: string[] = [];
  estimation: CalorieEstimation | null = null;
  loading = false;

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.recipeService.getAll().subscribe(data => this.recipes = data);
  }

  addIngredient(): void {
    const trimmed = this.ingredientInput.trim();
    if (trimmed && !this.ingredients.includes(trimmed)) {
      this.ingredients.push(trimmed);
    }
    this.ingredientInput = '';
  }

  removeIngredient(ingredient: string): void {
    this.ingredients = this.ingredients.filter(i => i !== ingredient);
  }

  estimateCalories(): void {
    if (!this.name || this.ingredients.length === 0) return;
    this.loading = true;
    this.recipeService.estimateCalories({ name: this.name, ingredients: this.ingredients })
      .subscribe(est => {
        this.estimation = est;
        this.loading = false;
      });
  }

  saveRecipe(): void {
    if (!this.name || this.ingredients.length === 0 || !this.estimation) return;
    this.recipeService.create({ name: this.name, ingredients: this.ingredients })
      .subscribe(recipe => {
        this.recipes.push(recipe);
        this.name = '';
        this.ingredients = [];
        this.ingredientInput = '';
        this.estimation = null;
      });
  }
}
