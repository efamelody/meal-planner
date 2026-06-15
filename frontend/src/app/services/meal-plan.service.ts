import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MealPlan, MealPlanRequest } from '../models/meal-plan.model';
import { isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private baseUrl = `${isDevMode() ? 'http://localhost:8080' : 'https://your-render-backend.onrender.com'}/api/meal-plans`;

  constructor(private http: HttpClient) {}

  getWeek(weekStart: string): Observable<MealPlan[]> {
    const params = new HttpParams().set('weekStart', weekStart);
    return this.http.get<MealPlan[]>(`${this.baseUrl}/week`, { params });
  }

  create(request: MealPlanRequest): Observable<MealPlan> {
    return this.http.post<MealPlan>(this.baseUrl, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
