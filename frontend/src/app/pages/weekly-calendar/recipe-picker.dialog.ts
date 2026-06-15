import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-picker-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Pick a Recipe</h2>
    <mat-dialog-content>
      <mat-nav-list>
        @for (recipe of data.recipes; track recipe.id) {
          <mat-list-item (click)="select(recipe.id)">
            <span matListItemTitle>{{ recipe.name }}</span>
            <span matListItemLine>{{ recipe.estimatedCalories }} kcal</span>
          </mat-list-item>
        }
      </mat-nav-list>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Cancel</button>
    </mat-dialog-actions>
  `
})
export class RecipePickerDialog {
  constructor(
    public dialogRef: MatDialogRef<RecipePickerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { recipes: Recipe[] }
  ) {}

  select(recipeId: number): void {
    this.dialogRef.close(recipeId);
  }
}
