# React to Angular — A Frontend Guide

> You know React + Tailwind. This guide maps everything you know to Angular 21 + Material UI,
> using the **meal-planner** codebase as a living example.
> Assumes you already read `GUIDE.md` for the Java/Spring Boot backend.

---

## Table of Contents
1. [Architecture: Framework vs Library](#1-architecture-framework-vs-library)
2. [Concept Mapping: React → Angular](#2-concept-mapping-react--angular)
3. [Template Syntax Deep Dive](#3-template-syntax-deep-dive)
4. [Services & Dependency Injection](#4-services--dependency-injection)
5. [RxJS: Observable vs Promise](#5-rxjs-observable-vs-promise)
6. [Routing](#6-routing)
7. [Component Lifecycle](#7-component-lifecycle)
8. [Angular Material vs Tailwind](#8-angular-material-vs-tailwind)
9. [Angular CLI Cheat Sheet](#9-angular-cli-cheat-sheet)
10. [File Structure Rules](#10-file-structure-rules)
11. [Every Frontend File Explained](#11-every-frontend-file-explained)
12. [Quick Start Checklist](#12-quick-start-checklist)

---

# 1. Architecture: Framework vs Library

**React is a library.** You decide the architecture — how to structure files, how to manage state, how to route.

**Angular is a framework.** It comes with strong opinions: a module system, dependency injection, a CLI, a
built-in HTTP client, a router, and a template language. You follow Angular's conventions.

### The big mental shift

| | React | Angular |
|---|---|---|
| Your code is... | functions that return JSX | classes with decorators + HTML templates |
| Component definition | `function MyComponent() { ... }` | `@Component({...}) class MyComponent { ... }` |
| UI = | JSX (JavaScript XML) | `.html` template file |
| Styling = | `className` + Tailwind | `.css` file per component (scoped) + Material theme |
| State = | `useState` hooks | Class properties (Angular re-renders automatically) |
| Side effects = | `useEffect` | Lifecycle hooks (`ngOnInit`, etc.) |
| Reusable logic = | Custom hooks | `@Injectable` services |
| HTTP calls = | `fetch` / `axios` / `useSWR` | `HttpClient` + RxJS `Observable` |
| Routing = | `react-router-dom` | Angular Router (built-in) |
| Data flow = | Props down, events up | `@Input()` down, `@Output()` up |
| Build tool = | Vite / Webpack | Angular CLI (`ng serve` / `ng build`) |

### What stays the same

- TypeScript (Angular uses it natively)
- npm for packages (`package.json`)
- Components still have a clear input/output boundary
- You still call backend APIs and handle responses

---

# 2. Concept Mapping: React → Angular

## 2.1 Component Structure

React:
```tsx
// Button.tsx
export default function Button({ label, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
```

Angular:
```typescript
// button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',       // ← your custom HTML tag
  standalone: true,              // ← Angular 17+, no NgModule needed
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  @Input() label = '';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();
}
```

```html
<!-- button.component.html -->
<button (click)="clicked.emit()" [disabled]="disabled">{{ label }}</button>
```

**Usage in another component:**
```html
<app-button label="Save" [disabled]="!formValid" (clicked)="handleSave()"></app-button>
```

| React | Angular |
|---|---|
| `<Button label="..." />` | `<app-button label="..." />` |
| `function Button({ label })` | `@Input() label` |
| `onClick={fn}` | `(clicked)="fn()"` (custom event) |
| `props.children` | `<ng-content></ng-content>` |

## 2.2 State

React (hooks):
```tsx
const [name, setName] = useState('');
const [recipes, setRecipes] = useState([]);
```

Angular (class properties):
```typescript
export class RecipesComponent {
  name = '';
  recipes: Recipe[] = [];
  loading = false;
}
```

**Key difference:** Angular uses **mutation** — you can push to arrays and assign to properties directly.
Angular's change detection (Zone.js) automatically re-renders the view. You don't need a setter function.

```typescript
// React:
setRecipes([...recipes, newRecipe]);

// Angular:
this.recipes.push(newRecipe);  // ← direct mutation works
this.name = '';                 // ← direct assignment works
```

## 2.3 Effects (useEffect → Lifecycle Hooks)

React:
```tsx
useEffect(() => {
  fetchRecipes();
}, []); // runs once on mount
```

Angular:
```typescript
export class RecipesComponent implements OnInit {
  ngOnInit(): void {
    this.fetchRecipes();
  }
}
```

React cleanup / unsubscribe:
```tsx
useEffect(() => {
  const sub = someObservable.subscribe(...);
  return () => sub.unsubscribe(); // cleanup on unmount
}, []);
```

Angular cleanup:
```typescript
export class RecipesComponent implements OnInit, OnDestroy {
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.recipeService.getAll().subscribe(...);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
```

| React | Angular |
|---|---|
| `useEffect(fn, [])` | `ngOnInit()` |
| `useEffect(fn, [dep])` | `ngOnChanges()` |
| `useEffect(() => fn, [])` (cleanup) | `ngOnDestroy()` |
| `useLayoutEffect` | `ngAfterViewInit()` |

## 2.4 Event Handling

React:
```tsx
<button onClick={() => handleClick(id)}>Delete</button>
<input onChange={(e) => setName(e.target.value)} />
```

Angular:
```html
<button (click)="handleClick(id)">Delete</button>
<input (input)="name = $any($event.target).value" />
```

Better: use `[(ngModel)]` for two-way binding on inputs:
```html
<input [(ngModel)]="name" />
```
This is equivalent to React's controlled component pattern.

### Common event bindings

| React | Angular |
|---|---|
| `onClick={fn}` | `(click)="fn()"` |
| `onChange={fn}` | `(change)="fn()"` or `(input)="fn()"` |
| `onSubmit={fn}` | `(ngSubmit)="fn()"` |
| `onKeyDown={fn}` | `(keydown)="fn()"` |
| `onKeyUp={fn}` | `(keyup.enter)="fn()"` (specific key!) |
| `onFocus={fn}` | `(focus)="fn()"` |
| `onBlur={fn}` | `(blur)="fn()"` |

## 2.5 Conditional Rendering

React:
```tsx
{loading && <Spinner />}
{!loading && <div>Content</div>}

{loading ? <Spinner /> : <div>Content</div>}

{recipes.length === 0 && <EmptyState />}
```

Angular (Angular 17+ syntax):
```html
@if (loading) {
  <app-spinner />
} @else {
  <div>Content</div>
}

@if (recipes.length === 0) {
  <p class="empty-state">No recipes yet.</p>
}
```

Older Angular (`*ngIf`) is still common:
```html
<div *ngIf="loading">Loading...</div>
```

**Use `@if` / `@for` syntax (Angular 17+).** It's cleaner and faster.

## 2.6 Lists / Iteration

React:
```tsx
{recipes.map(recipe => (
  <div key={recipe.id}>{recipe.name}</div>
))}
```

Angular (Angular 17+):
```html
@for (recipe of recipes; track recipe.id) {
  <div>{{ recipe.name }}</div>
}
```

**`track` is required** — it's Angular's version of React's `key` prop, used for efficient DOM updates.

## 2.7 Class & Style Binding

React (Tailwind):
```tsx
<div className={`card ${active ? 'border-blue-500' : ''}`}>
```

Angular:
```html
<div [class.active]="active" class="card">
```

Angular also supports:
```html
<div [style.color]="isError ? 'red' : 'green'">
<div [ngClass]="{ active: isActive, disabled: isDisabled }">
```

But you'll mostly use plain CSS classes:
```css
/* recipes.component.css */
.active { border: 2px solid blue; }
```

## 2.8 Two-Way Binding

Angular's killer feature React doesn't have natively:

React:
```tsx
<input value={name} onChange={e => setName(e.target.value)} />
```

Angular:
```html
<input [(ngModel)]="name" />
```

`[(ngModel)]` is **banana-in-a-box** syntax — property binding `[]` + event binding `()` combined.
This is the Angular way of saying "keep this input and this property in sync."

Requires `FormsModule` in your imports:
```typescript
@Component({
  imports: [FormsModule, ...]
})
```

---

# 3. Template Syntax Deep Dive

Using real examples from this project's `recipes.component.html`.

## 3.1 Property Binding `[property]="expr"`

Bind a component property to an HTML attribute or DOM property.

```html
<!-- Bind disabled attribute to the loading property -->
<button [disabled]="!name || ingredients.length === 0 || loading">
  Save Recipe
</button>
```

| React | Angular |
|---|---|
| `disabled={!name}` | `[disabled]="!name"` |
| `src={imageUrl}` | `[src]="imageUrl"` |
| `hidden={isHidden}` | `[hidden]="isHidden"` |

## 3.2 Event Binding `(event)="handler()"`

```html
<button (click)="saveRecipe()">Save Recipe</button>
<input (keyup.enter)="addIngredient()" />
```

Angular supports **key filters**: `(keyup.enter)`, `(keydown.escape)`, etc.

## 3.3 Two-Way Binding `[(ngModel)]`

```html
<input matInput [(ngModel)]="name" placeholder="e.g. Chicken Stir Fry" />
```

## 3.4 Control Flow `@if` / `@for`

From this project:
```html
@if (ingredients.length > 0) {
  <mat-chip-set>
    @for (ing of ingredients; track ing) {
      <mat-chip [removable]="true" (removed)="removeIngredient(ing)">
        {{ ing }}
        <mat-icon matChipRemove>cancel</mat-icon>
      </mat-chip>
    }
  </mat-chip-set>
}

@if (recipes.length === 0) {
  <p class="empty-state">No recipes yet. Create your first one!</p>
}

@for (recipe of recipes; track recipe.id) {
  <mat-list-item>
    <span matListItemTitle>{{ recipe.name }}</span>
    <span matListItemLine>{{ recipe.estimatedCalories }} kcal</span>
  </mat-list-item>
}
```

## 3.5 Interpolation `{{ expr }}`

```html
<p><strong>{{ estimation.estimatedCalories }}</strong> kcal</p>
<p>{{ estimation.summary }}</p>

{{ loading ? 'Estimating...' : 'Estimate Calories' }}
```

Angular interpolates the expression and auto-escapes HTML (safe by default, like React JSX).

## 3.6 Template Reference Variables `#var`

Get a reference to an element or directive:
```html
<input #myInput (keyup.enter)="handleInput(myInput.value)" />
```

You can use `#form="ngForm"` to reference a form controller, etc.

---

# 4. Services & Dependency Injection

This is Angular's replacement for custom hooks, Context, and prop-drilling.

## 4.1 Creating a Service (this project)

```typescript
// recipe.service.ts
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
```

### Key points:
- `@Injectable({ providedIn: 'root' })` — makes it a **singleton** available everywhere
- The constructor asks for `HttpClient` — Angular **injects** it automatically
- Methods return `Observable<T>` (not `Promise<T>`)
- `isDevMode()` switches between localhost and production URLs

## 4.2 Using a Service in a Component

```typescript
// recipes.component.ts
export class RecipesComponent implements OnInit {
  recipes: Recipe[] = [];

  constructor(private recipeService: RecipeService) {}  // ← injection

  ngOnInit(): void {
    this.recipeService.getAll().subscribe(data => this.recipes = data);
  }

  saveRecipe(): void {
    this.recipeService.create({ name: this.name, ingredients: this.ingredients })
      .subscribe(recipe => {
        this.recipes.push(recipe);
        // reset form...
      });
  }
}
```

**React mental model:**
```
React:                   Angular:
useRecipeService()       constructor(private recipeService: RecipeService) {}
const { data } =         this.recipeService.getAll()
  useSWR('/api/...')       .subscribe(data => ...)
```

### 4.3 Service with Query Params

```typescript
// meal-plan.service.ts
getWeek(weekStart: string): Observable<MealPlan[]> {
  const params = new HttpParams().set('weekStart', weekStart);
  return this.http.get<MealPlan[]>(`${this.baseUrl}/week`, { params });
}
```

This builds: `GET /api/meal-plans/week?weekStart=2026-06-15`

### 4.4 Service with RxJS Transformation

```typescript
// grocery.service.ts
getList(weekStart: string): Observable<GroceryItem[]> {
  const params = new HttpParams().set('weekStart', weekStart);
  return this.http.get<string[]>(this.baseUrl, { params }).pipe(
    map(items => items.map(name => ({ name, checked: false })))
  );
}
```

- `.pipe(map(...))` transforms the emitted value — like `.then()` on a Promise
- Backend returns `string[]`, we transform to `GroceryItem[]`

### 4.5 How DI Actually Works

```
┌─────────────────────────────────────┐
│  app.config.ts                       │
│  provideHttpClient(withFetch())      │ ← registers HttpClient as a provider
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  RecipeService                       │
│  constructor(private http: HttpClient) {} ← Angular injects HttpClient here
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  RecipesComponent                    │
│  constructor(private rs: RecipeService) {} ← Angular injects RecipeService here
└─────────────────────────────────────┘
```

Angular looks at the constructor parameter types, finds registered providers, and wires them up.
This is called **Dependency Injection** — it's like React Context but built into the framework.

---

# 5. RxJS: Observable vs Promise

This is the most confusing part for React devs. Let me make it concrete.

## 5.1 The Core Difference

| | Promise | Observable |
|---|---|---|
| Emits | One value, then done | Zero to many values over time |
| Lazy? | No (executes immediately) | Yes (nothing happens until `.subscribe()`) |
| Cancellable? | No (can't un-fetch) | Yes (call `.unsubscribe()`) |
| Operators? | Just `.then()` | `.pipe(map, filter, debounceTime, ...)` |
| Angular uses | No | Yes (everything HTTP) |

## 5.2 For HTTP Calls (What You'll Do 90% of the Time)

React:
```typescript
const data = await fetch('/api/recipes');
const recipes = await data.json();
```

Angular:
```typescript
this.recipeService.getAll().subscribe(recipes => {
  this.recipes = recipes;
});
```

**Think of `.subscribe()` as `.then()`:**

| Promise | Observable |
|---|---|
| `fetch(url).then(data => ...)` | `http.get(url).subscribe(data => ...)` |
| `await fetch(url)` | Call `.subscribe()` and assign in callback |
| `const data = await promise` | `observable.subscribe(data => this.data = data)` |

## 5.3 Common RxJS Operators

```typescript
import { map, filter, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Transform the value (like .then())
http.get<Recipe[]>(url).pipe(
  map(recipes => recipes.filter(r => r.estimatedCalories > 100))
).subscribe(...);

// Handle errors
http.get<Recipe[]>(url).pipe(
  catchError(err => {
    console.error('Failed:', err);
    return of([]); // return empty array as fallback
  })
).subscribe(...);
```

## 5.4 The `async` Pipe (Angular Magic)

Instead of subscribing in the component:

```typescript
// Component
export class RecipesComponent {
  recipes$ = this.recipeService.getAll();  // $ naming convention = Observable
}
```

```html
<!-- Template: Angular auto-subscribes and auto-unsubscribes -->
@for (recipe of recipes$ | async; track recipe.id) {
  <div>{{ recipe.name }}</div>
}
```

The `| async` pipe:
- Subscribes to the Observable
- Extracts the value
- Auto-unsubscribes when the component is destroyed

**No memory leaks. No manual subscribe/unsubscribe.**

---

# 6. Routing

## 6.1 Route Configuration (this project)

```typescript
// app.routes.ts
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
```

| React Router | Angular Router |
|---|---|
| `<Routes><Route path="/" element={<X />} />` | `Routes` array with `{ path, component/loadComponent }` |
| `lazy(() => import(...))` | `loadComponent: () => import(...)` |
| `Navigate to="/recipes"` | `redirectTo: '/recipes'` |
| `<Outlet />` | `<router-outlet />` |
| `useNavigate()` | `Router.navigate()` |
| `useParams()` | `ActivatedRoute.params` |
| `useSearchParams()` | `ActivatedRoute.queryParams` |

## 6.2 Registering Routes

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),  // ← enables the router
    provideHttpClient(withFetch()),
    provideAnimationsAsync()
  ]
};
```

## 6.3 Template Navigation

```html
<!-- navbar.component.html -->
<a routerLink="/recipes" routerLinkActive="active-link">Recipes</a>
<a routerLink="/weekly-calendar" routerLinkActive="active-link">Weekly Calendar</a>
<a routerLink="/grocery-list" routerLinkActive="active-link">Grocery List</a>
```

| React | Angular |
|---|---|
| `<Link to="/recipes">` | `<a routerLink="/recipes">` |
| `NavLink` with `className` | `routerLinkActive="active"` |
| `<Outlet />` | `<router-outlet />` |

## 6.4 Page Layout

```html
<!-- app.html -->
<app-navbar></app-navbar>
<main>
  <router-outlet />  <!-- ← each route's component renders here -->
</main>
```

---

# 7. Component Lifecycle

## 7.1 Lifecycle Diagram

```
React:                    Angular:
constructor()             constructor()          ← set up DI, init values
                          ngOnChanges()          ← runs when @Input() changes
useEffect(fn, [])         ngOnInit()             ← runs once, fetch data here
                          ngDoCheck()            ← runs on every change detection
                          ngAfterViewInit()      ← after template rendered
useEffect(() => fn)       ngOnDestroy()          ← cleanup, unsubscribe
```

## 7.2 You only need these three (95% of the time)

```typescript
export class MyComponent implements OnInit, OnDestroy {
  constructor() {
    // 1. DI injection only. Don't fetch data here.
  }

  ngOnInit(): void {
    // 2. Fetch data, set up subscriptions.
    //    Like useEffect(fn, [])
  }

  ngOnDestroy(): void {
    // 3. Clean up subscriptions, timers, event listeners.
    //    Like useEffect(() => cleanupFn)
    this.sub?.unsubscribe();
  }
}
```

## 7.3 Real Example from This Project

```typescript
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
  // ... methods never need cleanup because HttpClient.subscribe() auto-completes
}
```

---

# 8. Angular Material vs Tailwind

You said you use Tailwind. This project uses **Angular Material**. Here's the difference.

## 8.1 Philosophy

| | Tailwind | Angular Material |
|---|---|---|
| Approach | Utility-first CSS | Pre-built component library |
| Your job | Compose classes to build UI | Configure pre-made components |
| Learning curve | Learn the class names | Learn the component API |
| Customization | `@apply` or custom CSS | Theming (CSS variables, `.scss` mixins) |
| Looks like | Anything you build | Google Material Design 3 |

## 8.2 Side-by-Side Comparison

A button:

Tailwind:
```html
<button class="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50">
  Save Recipe
</button>
```

Material:
```html
<button mat-raised-button color="primary" [disabled]="!formValid">
  Save Recipe
</button>
```

An input:

Tailwind:
```html
<input class="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500" />
```

Material:
```html
<mat-form-field appearance="outline" class="full-width">
  <mat-label>Recipe Name</mat-label>
  <input matInput [(ngModel)]="name" />
</mat-form-field>
```

A card:

Tailwind:
```html
<div class="bg-white rounded-xl shadow-md p-6">
  <h2 class="text-lg font-semibold">New Recipe</h2>
  ...
</div>
```

Material:
```html
<mat-card>
  <mat-card-header>
    <mat-card-title>New Recipe</mat-card-title>
  </mat-card-header>
  <mat-card-content>...</mat-card-content>
</mat-card>
```

## 8.3 Can You Use Both?

**Yes.** Many teams do. Material provides complex components (date pickers, data tables, dialogs, chips)
while Tailwind handles layout, spacing, and typography.

```html
<div class="flex gap-4 p-6">          <!-- Tailwind for layout -->
  <mat-card class="flex-1">            <!-- Material for card component -->
    <mat-card-content>...</mat-card-content>
  </mat-card>
</div>
```

To add Tailwind to Angular: `ng add @angular/material` (wait, that's Material).
For Tailwind: `npm install tailwindcss` then configure the CSS pipeline.
This is beyond this guide, but it's well-documented.

## 8.4 Material 3 Theming (this project)

```scss
// material-theme.scss
@use '@angular/material' as mat;

html {
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}

body {
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}
```

Material 3 uses CSS variables (`--mat-sys-*`) for theming. You can customize colors, typography, and spacing
through the theme API or by overriding CSS variables.

---

# 9. Angular CLI Cheat Sheet

| Task | Command |
|---|---|
| Start dev server | `ng serve` (or `npm start`) |
| Create component | `ng g c path/name` |
| Create service | `ng g s path/name` |
| Create interface/model | `ng g i path/name` |
| Build for production | `ng build` |
| Create new app | `ng new my-app` |
| Generate guard | `ng g g path/name` |
| Generate pipe | `ng g p path/name` |
| Generate directive | `ng g d path/name` |
| Dry-run (see what would be created) | `ng g c name --dry-run` |
| Skip tests | `ng g c name --skip-tests` |

### Common flags

```bash
ng g c pages/recipes          # Creates pages/recipes/ directory
ng g c shared/navbar          # Creates shared/navbar/ directory
ng g s services/recipe        # Creates services/recipe.service.ts
ng g i models/recipe          # Creates models/recipe.ts
```

Without `--skip-tests`, Angular generates `.spec.ts` files by default. This project's
`angular.json` has `"skipTests": true` for all schematic types.

---

# 10. File Structure Rules

## 10.1 This Project's Structure

```
frontend/src/
├── index.html                  ← Single HTML page (like public/index.html)
├── main.ts                     ← Entry point (bootstraps Angular)
├── styles.css                  ← Global styles
├── material-theme.scss         ← Material 3 theme
├── environments/
│   ├── environment.ts          ← Dev API URL
│   └── environment.development.ts ← Prod API URL
└── app/
    ├── app.config.ts           ← App-wide providers (router, http, etc.)
    ├── app.routes.ts           ← Route definitions
    ├── app.ts                  ← Root component
    ├── app.html                ← Root template
    ├── app.css                 ← Root styles
    ├── models/                 ← TypeScript interfaces (mirror Java Records)
    │   ├── recipe.model.ts
    │   ├── meal-plan.model.ts
    │   └── grocery-item.model.ts
    ├── services/               ← HTTP calls (mirror Java Service layer)
    │   ├── recipe.service.ts
    │   ├── meal-plan.service.ts
    │   └── grocery.service.ts
    ├── pages/                  ← Route-level components (one folder per route)
    │   ├── recipes/
    │   │   ├── recipes.component.ts
    │   │   ├── recipes.component.html
    │   │   └── recipes.component.css
    │   ├── weekly-calendar/
    │   │   ├── weekly-calendar.component.ts
    │   │   ├── weekly-calendar.component.html
    │   │   ├── weekly-calendar.component.css
    │   │   └── recipe-picker.dialog.ts   ← Material dialog
    │   └── grocery-list/
    │       ├── grocery-list.component.ts
    │       ├── grocery-list.component.html
    │       └── grocery-list.component.css
    └── shared/                 ← Reusable components
        └── navbar/
            ├── navbar.component.ts
            ├── navbar.component.html
            └── navbar.component.css
```

## 10.2 The Rules

1. **Each component is a folder** — `.ts` + `.html` + `.css` with matching names
2. **`models/`** — Plain TypeScript interfaces. No Angular imports needed.
3. **`services/`** — Classes with `@Injectable()`. Business logic + HTTP calls.
4. **`pages/`** — Route-level components. Each gets its own folder.
5. **`shared/`** — Reusable components used across multiple pages.
6. **File naming**: `<name>.component.ts`, `<name>.service.ts`, `<name>.model.ts`
7. **Components are standalone** (no NgModules). Dependencies declared via `imports: [...]`.

## 10.3 Comparison with React

```
React:                              Angular:
├── components/                     ├── pages/
│   ├── Recipes.jsx                 │   ├── recipes/
│   ├── Navbar.jsx                  │   │   ├── recipes.component.ts
│   └── WeeklyCalendar.jsx          │   │   ├── recipes.component.html
├── hooks/                          │   │   └── recipes.component.css
│   ├── useRecipes.js               │   └── ...
├── services/                       ├── services/
│   └── api.js                      │   └── recipe.service.ts
├── types/                          ├── models/
│   └── recipe.ts                   │   └── recipe.model.ts
```

---

# 11. Every Frontend File Explained

## 11.1 `main.ts` — Entry Point

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

**What it does:** Starts the Angular app. Like `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`.

- `bootstrapApplication(App, appConfig)` — tell Angular: "start with App component, use these providers"
- `appConfig` — registers router, HTTP client, animations

## 11.2 `index.html` — Single HTML Page

```html
<body>
  <app-root></app-root>
</body>
```

Angular is a **Single Page Application** (SPA). This is the only HTML file served.
`<app-root>` is the selector of the `App` component — Angular replaces this tag with the full app.

## 11.3 `app.config.ts` — App-Wide Providers

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),              // ← Router
    provideHttpClient(withFetch()),      // ← HttpClient (with fetch API backend)
    provideAnimationsAsync()             // ← Material animations
  ]
};
```

**Equivalent to:**
- React: wrapping your app in `<BrowserRouter>`, setting up axios defaults
- Next.js: `next.config.js`

Each `provide*` function registers a service or feature globally.

## 11.4 `app.routes.ts` — Route Definitions

```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  { path: 'recipes', loadComponent: () => import('./pages/recipes/recipes.component').then(m => m.RecipesComponent) },
  { path: 'weekly-calendar', loadComponent: () => import(...) },
  { path: 'grocery-list', loadComponent: () => import(...) }
];
```

**`loadComponent`** = lazy loading. The component's code is only fetched when the user navigates to that route.
Like React's `React.lazy(() => import('./Recipes'))`.

**`redirectTo`** = default route. Visiting `/` sends you to `/recipes`.

## 11.5 `app.ts` — Root Component

```typescript
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Meal Planner';
}
```

```html
<app-navbar></app-navbar>
<main>
  <router-outlet />
</main>
```

This is the **shell** — the layout that wraps every page. The navbar stays fixed;
only the `<router-outlet />` content changes when you navigate.

**Like React:**
```tsx
function App() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />  <!-- React Router's version -->
      </main>
    </>
  );
}
```

## 11.6 Models (`*.model.ts`)

```typescript
// recipe.model.ts
export interface Recipe {
  id: number;
  name: string;
  ingredients: string;
  estimatedCalories: number;
}

export interface RecipeRequest {
  name: string;
  ingredients: string[];
}

export interface CalorieEstimation {
  estimatedCalories: number;
  summary: string;
}
```

**Pure TypeScript interfaces.** No Angular-specific code.
They mirror the Java Records on the backend exactly.

**Why duplicate the shape?**
- TypeScript enforces the shape at compile time
- The backend enforces it at runtime
- If the API changes, TypeScript will flag every place that uses the old shape

## 11.7 Services (`*.service.ts`)

Already covered in depth in [Section 4](#4-services--dependency-injection).

## 11.8 Page Components (`pages/recipes/`)

Each page is a component with three files:

**TypeScript class** — state + methods:
```typescript
@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, ...],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.css'
})
export class RecipesComponent implements OnInit {
  recipes: Recipe[] = [];

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.recipeService.getAll().subscribe(data => this.recipes = data);
  }

  addIngredient(): void { ... }
  estimateCalories(): void { ... }
  saveRecipe(): void { ... }
}
```

**HTML template** — the UI:
```html
<div class="page-layout">
  <mat-card class="form-card">
    <input [(ngModel)]="name" />
    <input [(ngModel)]="ingredientInput" (keyup.enter)="addIngredient()" />

    @if (ingredients.length > 0) {
      @for (ing of ingredients; track ing) {
        <mat-chip (removed)="removeIngredient(ing)">{{ ing }}</mat-chip>
      }
    }

    <button (click)="estimateCalories()" [disabled]="loading">
      {{ loading ? 'Estimating...' : 'Estimate Calories' }}
    </button>
  </mat-card>

  <mat-card class="list-card">
    @for (recipe of recipes; track recipe.id) {
      <mat-list-item>{{ recipe.name }}</mat-list-item>
    }
  </mat-card>
</div>
```

**CSS** — scoped styles (automatically):
```css
.page-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
```

**Angular scopes CSS automatically.** Styles in `recipes.component.css` only apply to the `recipes.component.html` template. No CSS modules, no BEM, no scoped stylesheets needed.

## 11.9 Shared Components (`shared/navbar/`)

```typescript
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {}
```

```html
<mat-toolbar color="primary">
  <span>Meal Planner</span>
  <nav>
    <a mat-button routerLink="/recipes" routerLinkActive="active-link">Recipes</a>
    <a mat-button routerLink="/weekly-calendar" routerLinkActive="active-link">Weekly Calendar</a>
    <a mat-button routerLink="/grocery-list" routerLinkActive="active-link">Grocery List</a>
  </nav>
</mat-toolbar>
```

## 11.10 Environments (`environments/`)

```typescript
// environment.ts (dev)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};

// environment.development.ts (prod)
export const environment = {
  production: true,
  apiUrl: 'https://your-render-backend.onrender.com/api'
};
```

Angular's `environment` files are replaced at build time:
- `ng serve` → `environment.ts`
- `ng build --configuration production` → `environment.development.ts`

This project uses `isDevMode()` instead of environment files for the API URL (simpler).

---

# 12. Quick Start Checklist

When you start building a new page in Angular:

1. **Create the model** — `models/my-feature.model.ts`
   - Define TypeScript interfaces mirroring the API shape

2. **Create the service** — `services/my-feature.service.ts`
   - `@Injectable({ providedIn: 'root' })`
   - Inject `HttpClient`
   - Write methods returning `Observable<T>`

3. **Generate the component** — `ng g c pages/my-feature --skip-tests`
   - Add route in `app.routes.ts` with `loadComponent`
   - Implement `OnInit`, call service in `ngOnInit`
   - Expose state as class properties

4. **Write the template** — `my-feature.component.html`
   - `@if` / `@for` for conditionals and lists
   - `[(ngModel)]` for form inputs
   - `(click)` for events
   - `[disabled]` / `[class.active]` for bindings
   - `{{ expr }}` for interpolation

5. **Style it** — `my-feature.component.css`
   - Scoped automatically
   - Use Material components where possible
   - Plain CSS for everything else

6. **Add to navbar** — `shared/navbar/navbar.component.html`
   - `<a mat-button routerLink="/my-feature">My Feature</a>`

---

## Appendix: React → Angular Quick Reference

| You know (React) | Write this (Angular) |
|---|---|
| `useState('')` | `name = ''` |
| `setName('x')` | `this.name = 'x'` |
| `useEffect(fn, [])` | `ngOnInit() { fn() }` |
| `useEffect(() => cleanup, [])` | `ngOnDestroy() { cleanup() }` |
| `{data.map(x => <div key={x.id}>{x.name}</div>)}` | `@for (x of data; track x.id) { {{ x.name }} }` |
| `{cond && <X/>}` | `@if (cond) { <X/> }` |
| `{cond ? <A/> : <B/>}` | `@if (cond) { <A/> } @else { <B/> }` |
| `<button onClick={fn}>` | `<button (click)="fn()">` |
| `<input value={x} onChange={e=>setX(e.target.value)} />` | `<input [(ngModel)]="x" />` |
| `className="foo"` | `class="foo"` |
| `<Child prop={val} />` | `<app-child [prop]="val" />` |
| `<img src={url} />` | `<img [src]="url" />` |
| `fetch(url).then(d => ...)` | `http.get(url).subscribe(d => ...)` |
| `await axios.get(url)` | `service.method().subscribe(d => this.data = d)` |
| `export default function C()` | `@Component({...}) export class C {}` |
| React Context | Constructor injection |
| React Router `<Link>` | `<a routerLink="/path">` |
| `npm run dev` | `ng serve` |

---

> **One final tip:** Don't fight Angular. When you find yourself thinking "in React I would...",
> stop and ask "how does Angular want me to do this?" Angular has a canonical way for everything.
> Once you find it, the framework stays out of your way.
