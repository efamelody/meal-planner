import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recipe, RecipeRequest, CalorieEstimation } from '../models/recipe.model';
import { isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private apiUrl = `${isDevMode() ? 'http://localhost:8080' : 'https://your-render-backend.onrender.com'}/api/recipes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.apiUrl);
  }

  create(request: RecipeRequest): Observable<Recipe> {
    return this.http.post<Recipe>(this.apiUrl, request);
  }

  estimateCalories(request: RecipeRequest): Observable<CalorieEstimation> {
    return this.http.post<CalorieEstimation>(`${this.apiUrl}/estimate-calories`, request);
  }
}
