import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroceryItem } from '../models/grocery-item.model';
import { isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GroceryService {
  private baseUrl = `${isDevMode() ? 'http://localhost:8080' : 'https://your-render-backend.onrender.com'}/api/grocery-list`;

  constructor(private http: HttpClient) {}

  getList(weekStart: string): Observable<GroceryItem[]> {
    const params = new HttpParams().set('weekStart', weekStart);
    return this.http.get<string[]>(this.baseUrl, { params }).pipe(
      map(items => items.map(name => ({ name, checked: false })))
    );
  }
}
