# GUIDE2.md — Running, File Structure & Routes Cheat Sheet

> A no-fluff reference for someone coming from Next.js to Java + Spring Boot.
> Assumes you already read `GUIDE.md` for concept mapping.

---

## 1. Package Managers: Maven vs npm

| You know (Next.js) | This project (Java backend) |
|---|---|
| `package.json` | `backend/pom.xml` |
| `npm install` | **Not needed.** Maven downloads deps automatically on first run |
| `npm run build` | `mvn package` (produces a `.jar` file) |
| `npm run dev` | `mvn spring-boot:run` |
| `npm install some-pkg` | Add a `<dependency>` block inside `pom.xml` |
| `node_modules/` | `~/.m2/repository/` (global cache, not per-project) |

**Frontend is still npm.** `frontend/package.json` — works exactly as you expect.

---

## 2. How to Run: Two Terminals

You need **two separate terminal windows** — backend + frontend run independently.

### Terminal 1 — Backend (Spring Boot)

```powershell
# From repo root:
.\run.ps1
```

Or manually:
```powershell
cd backend
mvn spring-boot:run
```

- Starts on **http://localhost:8080**
- Maven auto-compiles `.java` files and starts an embedded Tomcat server
- You'll see logs like `Tomcat started on port 8080` when it's ready

### Terminal 2 — Frontend (Angular)

```powershell
# First time only:
cd frontend
npm install

# Every time:
npm start
# OR .\run-frontend.ps1
```

- Starts on **http://localhost:4200**
- Open this URL in your browser
- The Angular app talks to `localhost:8080` under the hood

---

## 3. Java File Structure vs Next.js

### Next.js (file path = route, implicit)

```
app/api/recipes/route.ts    →  GET /api/recipes
app/api/recipes/[id]/route.ts → GET /api/recipes/5
```

The route **is** the file path. Convention over configuration.

### Spring Boot (packages by domain, explicit)

```
backend/src/main/java/com/mealplanner/
├── MealPlannerApplication.java   ← entry point (main method)
├── config/CorsConfig.java        ← CORS rules
├── recipe/                       ← all recipe files
│   ├── Recipe.java               ← database model
│   ├── RecipeController.java     ← routes
│   ├── RecipeService.java        ← business logic
│   ├── RecipeRepository.java     ← database access
│   ├── RecipeRequest.java        ← POST request shape
│   └── CalorieEstimation.java    ← response shape
├── mealplan/                     ← same pattern for meal plans
│   ├── MealPlan.java
│   ├── MealPlanController.java
│   ├── MealPlanService.java
│   ├── MealPlanRepository.java
│   ├── MealPlanRequest.java
│   └── MealType.java
└── grocery/                      ← same pattern for grocery
    ├── GroceryController.java
    └── GroceryService.java
```

**Key differences:**
- Java groups files by **domain/feature** (all recipe files together), not by role (controllers folder, services folder)
- Java packages (`com.mealplanner.recipe`) are just namespaces — think of them like `@mealplanner/recipe` in npm
- Route = explicit annotation on the method, not inferred from file location

---

## 4. Route Reference: Every API Endpoint

| Method | Path | Controller File | Line |
|---|---|---|---|
| `GET` | `/api/recipes` | `RecipeController.java` | 19 |
| `POST` | `/api/recipes` | `RecipeController.java` | 24 |
| `POST` | `/api/recipes/estimate-calories` | `RecipeController.java` | 31 |
| `GET` | `/api/meal-plans/week?weekStart=2026-06-15` | `MealPlanController.java` | 21 |
| `POST` | `/api/meal-plans` | `MealPlanController.java` | 27 |
| `DELETE` | `/api/meal-plans/{id}` | `MealPlanController.java` | 32 |
| `GET` | `/api/grocery-list?weekStart=2026-06-15` | `GroceryController.java` | 20 |

### How to read a controller

```java
@RestController                          // "This class handles HTTP requests, returns JSON"
@RequestMapping("/api/recipes")          // Base path for every method in this class
public class RecipeController {

    @GetMapping                          // GET  /api/recipes
    public ResponseEntity<List<Recipe>> getAllRecipes() { ... }

    @PostMapping                         // POST /api/recipes
    public ResponseEntity<Recipe> createRecipe(
            @Valid @RequestBody RecipeRequest request) { ... }

    @PostMapping("/estimate-calories")   // POST /api/recipes/estimate-calories
    public ResponseEntity<CalorieEstimation> estimateCalories(
            @Valid @RequestBody RecipeRequest request) { ... }
}
```

**Annotation cheat sheet:**

| Annotation | What it does |
|---|---|
| `@GetMapping` | Handle `GET` requests |
| `@PostMapping` | Handle `POST` requests |
| `@DeleteMapping` | Handle `DELETE` requests |
| `@RequestMapping("/base")` | Set base path on the class |
| `@PathVariable Long id` | Extract value from URL segment (`/meal-plans/5` → `id=5`) |
| `@RequestParam LocalDate weekStart` | Extract query parameter (`?weekStart=2026-06-15`) |
| `@RequestBody RecipeRequest req` | Deserialize JSON body into a Java record |
| `@Valid` | Validate the request body against annotations on the record |

### So in Next.js terms:
```
Next.js file                          Spring Boot annotation
──────────────────────────────────────────────────────────────
app/api/recipes/route.ts              @RequestMapping("/api/recipes") + @GetMapping
app/api/recipes/route.ts (POST)       @RequestMapping("/api/recipes") + @PostMapping
app/api/recipes/estimate/route.ts     @PostMapping("/estimate-calories")
app/api/meal-plans/[id]/route.ts      @DeleteMapping("/{id}")
```

---

## 5. Quick FAQ

**Q: Does Spring Boot have hot reload like Next.js?**
A: Not by default. You can add `spring-boot-devtools` for restart-on-change, but it's slower than Next.js HMR. `mvn spring-boot:run` does auto-compile Java changes (not as fast, but workable).

**Q: Do I need to restart the server every time I change a file?**
A: For most Java file changes, yes — unless you add DevTools. For static resources (HTML/CSS in the `resources/` folder), no.

**Q: What's the equivalent of `npm install` for Java?**
A: Nothing. Maven downloads dependencies (from `pom.xml`) on-the-fly when you build or run. The first `mvn spring-boot:run` will be slower as it downloads everything.

**Q: Where's the entry point?**
A: `MealPlannerApplication.java` — the `main()` method. Like `server.ts` or `index.js`.

**Q: Where's the route config file (like `routes.rb` or `next.config.js`)?**
A: There isn't one. Routes are declared inline on controller methods via annotations. To see all routes in a running app, visit `http://localhost:8080/actuator/mappings` if Actuator is enabled.
