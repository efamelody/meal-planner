import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/recipes',
    pathMatch: 'full'
  },
  {
    path: 'recipes',
    loadComponent: () => import('./pages/recipes/recipes.component').then(m => m.RecipesComponent)
  },
  {
    path: 'weekly-calendar',
    loadComponent: () => import('./pages/weekly-calendar/weekly-calendar.component').then(m => m.WeeklyCalendarComponent)
  },
  {
    path: 'grocery-list',
    loadComponent: () => import('./pages/grocery-list/grocery-list.component').then(m => m.GroceryListComponent)
  }
];
