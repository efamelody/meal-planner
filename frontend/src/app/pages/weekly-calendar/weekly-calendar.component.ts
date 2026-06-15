import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MealPlanService } from '../../services/meal-plan.service';
import { RecipeService } from '../../services/recipe.service';
import { MealPlan, MealType, MealPlanRequest } from '../../models/meal-plan.model';
import { Recipe } from '../../models/recipe.model';
import { RecipePickerDialog } from './recipe-picker.dialog';

@Component({
  selector: 'app-weekly-calendar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatSelectModule, MatDialogModule
  ],
  templateUrl: './weekly-calendar.component.html',
  styleUrl: './weekly-calendar.component.css'
})
export class WeeklyCalendarComponent implements OnInit {
  weekDays: Date[] = [];
  weekStart = '';
  mealTypes: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];
  mealPlans: MealPlan[] = [];
  recipes: Recipe[] = [];

  constructor(
    private mealPlanService: MealPlanService,
    private recipeService: RecipeService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const monday = this.getMonday(new Date());
    this.weekStart = this.toDateString(monday);
    this.loadWeek();
    this.recipeService.getAll().subscribe(r => this.recipes = r);
  }

  loadWeek(): void {
    this.weekDays = this.getWeekDays(new Date(this.weekStart));
    this.mealPlanService.getWeek(this.weekStart).subscribe(data => {
      this.mealPlans = data;
    });
  }

  previousWeek(): void {
    const d = new Date(this.weekStart);
    d.setDate(d.getDate() - 7);
    this.weekStart = this.toDateString(d);
    this.loadWeek();
  }

  nextWeek(): void {
    const d = new Date(this.weekStart);
    d.setDate(d.getDate() + 7);
    this.weekStart = this.toDateString(d);
    this.loadWeek();
  }

  getMealPlan(day: Date, mealType: MealType): MealPlan | undefined {
    const ds = this.toDateString(day);
    return this.mealPlans.find(mp => mp.mealDate === ds && mp.mealType === mealType);
  }

  openPicker(day: Date, mealType: MealType): void {
    const ref = this.dialog.open(RecipePickerDialog, {
      width: '400px',
      data: { recipes: this.recipes }
    });

    ref.afterClosed().subscribe((recipeId: number | undefined) => {
      if (recipeId) {
        const request: MealPlanRequest = {
          mealDate: this.toDateString(day),
          mealType: mealType,
          recipeId: recipeId
        };
        this.mealPlanService.create(request).subscribe(() => this.loadWeek());
      }
    });
  }

  removeMealPlan(id: number): void {
    this.mealPlanService.delete(id).subscribe(() => this.loadWeek());
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getWeekDays(monday: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
