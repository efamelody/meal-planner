# From Rails / Next.js to Java + Spring Boot

## A Complete Guided Tour of This Codebase

### Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Concept Mapping: What You Know → Java](#2-concept-mapping)
3. [Every Backend File Explained](#3-every-backend-file)
4. [Every Frontend File Explained](#4-every-frontend-file)
5. [End-to-End Walkthroughs](#5-end-to-end-walkthroughs)
6. [Key Java Concepts for Your Job](#6-key-java-concepts)
7. [Practice Exercises](#7-practice-exercises)
8. [Running + Deployment](#8-running-and-deployment)

---

# 1. Architecture Overview

## 1.1 What Did We Just Build?

```
meal-planner/
├── backend/         ← Java 21 + Spring Boot 3.4 + PostgreSQL (Supabase)
├── frontend/        ← Angular 21 + Material UI
├── src/             ← deleted (old placeholder)
├── .gitignore
├── GUIDE.md         ← this file
└── README.md
```

This is a **monorepo** — one git repository containing both the backend API and the frontend app. They are completely separate applications that communicate over HTTP.

### 1.2 The Three Layers

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Angular)                  │
│               Runs on: Vercel (production)            │
│               Runs on: http://localhost:4200 (dev)     │
│                                                       │
│   Recipes Page  ─┐                                    │
│   Weekly Calendar ┼──→ HTTP REST API calls ──────┐   │
│   Grocery List  ─┘                                 │   │
└───────────────────────────────────────────────────│───┘
                                                    │
                                                    ▼
┌──────────────────────────────────────────────────────┐
│                BACKEND (Spring Boot)                   │
│          Runs on: Render / Railway (production)        │
│          Runs on: http://localhost:8080 (dev)          │
│                                                        │
│   ┌──────────┐   ┌──────────┐   ┌──────────────┐      │
│   │Controller│→  │ Service  │→  │  Repository  │      │
│   │(routes)  │   │(logic)   │   │  (database)  │      │
│   └──────────┘   └──────────┘   └──────┬───────┘      │
│         │                               │              │
│         ▼                               ▼              │
│   ┌──────────┐                  ┌──────────────┐      │
│   │  Gemini  │                  │  Supabase    │      │
│   │  AI API  │                  │  PostgreSQL  │      │
│   └──────────┘                  └──────────────┘      │
└────────────────────────────────────────────────────────┘
```

### 1.3 How This Compares to What You Know

| Your Familiar Stack | This Stack |
|---|---|
| **Rails** (full-stack framework) | **Spring Boot** (full-stack Java framework) |
| **Next.js** (React + Node backend) | **Angular** (frontend only) + **Spring Boot** (backend only) |
| **ActiveRecord** (ORM) | **JPA / Hibernate** (ORM) |
| **RESTful routes** (`routes.rb`) | **Controllers + `@RequestMapping`** |
| **MVC** (Model-View-Controller) | **Layered Architecture** (Controller → Service → Repository) |
| **ERB/JSX templates** | **Angular components** (HTML + TypeScript) |
| **PostgreSQL** (directly or via Supabase) | **PostgreSQL** (via Supabase — same thing!) |
| **Gemfile** / `package.json` | **pom.xml** (Maven) |

### 1.4 Request Flow (The Most Important Diagram)

When a user clicks "Save Recipe" in the Angular app:

```
1. Browser renders Angular form
          │
2. User types "Chicken Stir Fry" + ingredients
          │
3. User clicks "Estimate Calories"
          │
4. Angular RecipeService.estimateCalories()
   sends POST http://localhost:8080/api/recipes/estimate-calories
   with JSON body: { "name": "Chicken Stir Fry", "ingredients": ["chicken", "broccoli"] }
          │
5. Spring Boot receives the HTTP request
          │
6. DispatcherServlet finds the right Controller method
   → RecipeController.estimateCalories()
          │
7. Spring automatically deserializes the JSON
   → creates a RecipeRequest record object
          │
8. Controller calls RecipeService.estimateCalories(request)
          │
9. Service builds a prompt string, calls Gemini AI API
   via RestTemplate (Java's HTTP client)
          │
10. Gemini responds with JSON like {"totalCalories": 450}
          │
11. Service parses the response → creates CalorieEstimation record
          │
12. Controller wraps it in ResponseEntity<CalorieEstimation>
          │
13. Spring automatically serializes it to JSON
   → sends HTTP 200 response back to Angular
          │
14. Angular receives the JSON, updates the UI
   → shows "450 kcal" on screen
```

Every single step in this flow is handled by **one of the files we wrote**. Understanding which file does what is the key to understanding the entire codebase.

---

# 2. Concept Mapping

## 2.1 TypeScript Interfaces → Java Records

In TypeScript:
```typescript
interface RecipeRequest {
  name: string;
  ingredients: string[];
}
```

In Java:
```java
public record RecipeRequest(
    @NotNull @NotEmpty String name,
    @NotNull @NotEmpty List<String> ingredients
) {}
```

**What's happening:**
- A `record` is Java's way of saying "this is just data, no logic."
- It auto-generates: constructor, getters (`request.name()`), `equals()`, `hashCode()`, `toString()`.
- `@NotNull` and `@NotEmpty` are **validation annotations** — like `yup` or `zod` schemas but attached directly to the field.
- Records are **immutable** — once created, you cannot change their fields. Like a TypeScript `Readonly<T>`.

**Key difference from TS Interfaces:**
- In TypeScript, interfaces vanish at runtime. In Java, records are real objects.
- Records are the idiomatic way to represent API request/response shapes in modern Java.

## 2.2 TypeScript Classes → Java Classes

In TypeScript:
```typescript
class Recipe {
  constructor(public id: number, public name: string) {}
}
```

In Java:
```java
@Entity
@Table(name = "recipes")
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // getters and setters...

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
}
```

**What's happening:**
- Java classes are like TypeScript classes, but:
  - **Fields are private** by convention (encapsulation)
  - **Getters/setters** are explicit methods (not auto-generated like TypeScript `public` fields)
  - The **empty constructor** `public Recipe() {}` is required by JPA (Hibernate needs it to create objects from database results)
  - The **parameterized constructor** `public Recipe(name, ingredients, calories)` is for when you create new objects in code

**Why so much code for a simple class?**
- This is the biggest culture shock coming from TypeScript/Rails.
- Java prioritizes **explicitness** over brevity.
- Every field's visibility (`private/public`), type, and lifecycle is explicitly declared.
- In practice, you can use **Lombok** annotations (`@Data`, `@Getter`, `@Setter`) to auto-generate this boilerplate, but I left it out so you can see what's really happening.

## 2.3 TypeScript Union Types → Java Enums

In TypeScript:
```typescript
type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';
```

In Java:
```java
public enum MealType {
    BREAKFAST,
    LUNCH,
    DINNER
}
```

**What's happening:**
- Java `enum` is a real type with three possible values.
- Unlike TypeScript string unions, Java enums are **type-safe** — you cannot accidentally pass `"breakfast"` (lowercase) instead of `MealType.BREAKFAST`.
- Enums can have methods, fields, and constructors (they're full classes).
- In the database, `@Enumerated(EnumType.STRING)` stores the value as the string `"BREAKFAST"` (readable) instead of `0` (numeric index).

## 2.4 npm / package.json → Maven / pom.xml

**Key analogy:** `pom.xml` = `package.json` + `Gemfile` combined.

| npm Concept | Maven Concept |
|---|---|
| `package.json` | `pom.xml` |
| `npm install` | `mvn install` (or just `mvn compile`) |
| `npm install lodash` | add `<dependency>` to `pom.xml` |
| `dependencies` | `<dependencies>` |
| `devDependencies` | `<scope>test</scope>` |
| `npm start` | `mvn spring-boot:run` |
| `npm run build` | `mvn package` |
| version in `package.json` | `<version>` in `pom.xml` |
| `node_modules/` | local Maven repository (at `~/.m2/repository/`) |

**The `pom.xml` structure:**
```xml
<parent>                          ← Inherits Spring Boot defaults (like extending a base class)
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.0</version>
</parent>

<dependencies>
    <dependency>                  ← Like `npm install spring-boot-starter-web`
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <!-- no version needed — parent provides it -->
    </dependency>

    <dependency>                  ← Like `npm install postgresql`
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>    ← Only needed at runtime, not compile time
    </dependency>
</dependencies>
```

## 2.5 async / await → Synchronous Java

In TypeScript:
```typescript
const recipes = await recipeService.getAll();
console.log(recipes);
```

In Java (backend):
```java
List<Recipe> recipes = recipeService.getAllRecipes();
System.out.println(recipes);
```

**Crucial insight:** Java backend code is **synchronous by default**. There is no `async`/`await`.

When you call `recipeRepository.findAll()`, the current thread **blocks** and waits for the database response. Spring Boot handles this by running each HTTP request on a **separate thread** (from a thread pool). So while one request is waiting for the database, another request can be processed on a different thread.

This is different from Node.js/TypeScript where everything is single-threaded and you _must_ use `async`/`await` to avoid blocking.

**The one place you DO use observables:** In Angular (frontend), because HTTP calls in the browser are async. That's why you see `.subscribe()` in the Angular services — it works like `.then()` on a Promise.

```
Angular (browser):             `http.get().subscribe(data => ...)`
  ↓ async HTTP call
Spring Boot (server):          `repository.findAll()` → blocks thread, waits for DB
  ↓ JDBC database call
PostgreSQL (Supabase):         Returns rows
  ↑ data flows back up the synchronous chain
```

## 2.6 Array.map / filter / reduce → Java Streams API

TypeScript:
```typescript
const groceryList = mealPlans
    .map(mp => mp.recipe)
    .flatMap(recipe => recipe.ingredients.split(','))
    .map(i => i.trim().toLowerCase())
    .filter((i, idx, arr) => arr.indexOf(i) === idx)  // distinct hack
    .sort();
```

Java:
```java
List<String> groceryList = weekPlans.stream()
    .map(MealPlan::getRecipe)
    .map(Recipe::getIngredients)
    .flatMap(ingredients -> Arrays.stream(ingredients.split(",")))
    .map(String::trim)
    .map(String::toLowerCase)
    .distinct()
    .sorted()
    .toList();
```

**The translation table:**

| TypeScript | Java Streams |
|---|---|
| `array.map(fn)` | `.stream().map(fn)` |
| `array.flatMap(fn)` | `.flatMap(fn)` |
| `array.filter(fn)` | `.filter(fn)` |
| `array.sort()` | `.sorted()` |
| `[...new Set(array)]` | `.distinct()` |
| `array.reduce(fn, init)` | `.reduce(fn, init)` |
| `array.forEach(fn)` | `.forEach(fn)` |
| `array.find(fn)` | `.filter(fn).findFirst()` or `anyMatch()` |
| `item => item.name` | `.map(Item::getName)` (method reference) |

**`::` is the method reference operator:**
- `Recipe::getIngredients` is shorthand for `recipe -> recipe.getIngredients()`
- It's like writing `r.getIngredients()` for each recipe, but more concise.
- Think of it as: pass each element to this function.

**Why `.stream()` first?**
- Lists in Java have `.stream()` which returns a `Stream<T>` — a sequence of elements you can pipe through operations.
- Without `.stream()`, you'd write nested for-loops.
- `.stream()` is the Java equivalent of the pipe operator `|>` or chained `.map().filter()`.

## 2.7 ActiveRecord / Prisma → JPA + Repositories

Rails:
```ruby
# Migration: create_table :recipes do |t|
#   t.string :name
#   t.text :ingredients
#   t.integer :estimated_calories
# end

# Model
class Recipe < ApplicationRecord
  validates :name, presence: true
end

# Usage
Recipe.all                                    # → SELECT * FROM recipes
Recipe.find(1)                                # → SELECT * FROM recipes WHERE id = 1
Recipe.create(name: "Pasta", ingredients: "...") # → INSERT INTO recipes
```

Java:
```java
// Entity (maps to the table)
@Entity @Table(name = "recipes")
public class Recipe {
    @Id @GeneratedValue
    private Long id;
    private String name;
    private String ingredients;
    private int estimatedCalories;
}

// Repository (provides CRUD operations)
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
}

// Usage
recipeRepository.findAll();                          // → SELECT * FROM recipes
recipeRepository.findById(1L);                       // → SELECT * FROM recipes WHERE id = 1
recipeRepository.save(new Recipe("Pasta", "..."));   // → INSERT INTO recipes
```

**Key insight:** `JpaRepository<Recipe, Long>` gives you ALL these methods for free:
- `findAll()` — get all rows
- `findById(id)` — get one by primary key (returns `Optional<Recipe>` — a box that might contain a Recipe or might be empty)
- `save(entity)` — insert or update
- `deleteById(id)` — delete by primary key
- `count()` — count rows
- And many more...

**Custom queries** work by declaring method names:
```java
interface MealPlanRepository extends JpaRepository<MealPlan, Long> {
    // Spring Data JPA reads this method name and generates the SQL:
    // "SELECT * FROM meal_plans WHERE meal_date BETWEEN ? AND ?"
    List<MealPlan> findByMealDateBetween(LocalDate start, LocalDate end);
}
```

This is called **query derivation** — Spring reads the method name pattern `findBy[Field][Operator]` and writes the SQL for you. No `@Query` annotation needed for simple cases.

## 2.8 Rails Routes / Next.js Routes → Controllers

Rails:
```ruby
# config/routes.rb
resources :recipes do
  collection do
    post :estimate_calories
  end
end

# app/controllers/recipes_controller.rb
class RecipesController < ApplicationController
  def index
    render json: Recipe.all
  end

  def create
    recipe = Recipe.create!(recipe_params)
    render json: recipe, status: :created
  end
end
```

Java:
```java
@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(recipeService.getAllRecipes());
    }

    @PostMapping
    public ResponseEntity<Recipe> createRecipe(@Valid @RequestBody RecipeRequest request) {
        // ...
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/estimate-calories")
    public ResponseEntity<CalorieEstimation> estimateCalories(@Valid @RequestBody RecipeRequest request) {
        // ...
        return ResponseEntity.ok(estimation);
    }
}
```

**Mapping table:**

| Rails | Java Spring |
|---|---|
| `resources :recipes` | `@RequestMapping("/api/recipes")` on class |
| `GET /recipes` → `index` | `@GetMapping` → `getAllRecipes()` |
| `POST /recipes` → `create` | `@PostMapping` → `createRecipe()` |
| `GET /recipes/:id` → `show` | `@GetMapping("/{id}")` → `getRecipe(@PathVariable Long id)` |
| `DELETE /recipes/:id` → `destroy` | `@DeleteMapping("/{id}")` → `deleteRecipe(@PathVariable Long id)` |
| `params.permit(:name, ...)` | `@Valid @RequestBody RecipeRequest request` |
| `render json: recipe` | `ResponseEntity.ok(recipe)` |
| `render json: recipe, status: :created` | `ResponseEntity.status(201).body(recipe)` |

## 2.9 Rails `validates` / Zod schemas → Jakarta Validation Annotations

Rails:
```ruby
class Recipe < ApplicationRecord
  validates :name, presence: true
end
```

Java:
```java
public record RecipeRequest(
    @NotNull @NotEmpty String name,
    @NotNull @NotEmpty List<String> ingredients
) {}
```

The `@Valid` annotation in the controller triggers validation:
```java
public ResponseEntity<CalorieEstimation> estimateCalories(
    @Valid @RequestBody RecipeRequest request  // ← validates here
)
```

If validation fails, Spring automatically returns HTTP 400 with error details — no manual check needed.

Common validation annotations:

| Annotation | Meaning |
|---|---|
| `@NotNull` | Value cannot be null |
| `@NotEmpty` | String/list cannot be null or empty |
| `@NotBlank` | String cannot be null, empty, or whitespace |
| `@Min(0)` | Number must be ≥ 0 |
| `@Max(100)` | Number must be ≤ 100 |
| `@Size(min=2, max=100)` | String length between 2 and 100 |
| `@Email` | Must be a valid email format |
| `@Pattern(regexp="...")` | Must match a regex |

---

# 3. Every Backend File Explained

## 3.1 `pom.xml` — The Build File

**What it does:** Defines the project, its dependencies (external libraries), and how to build it.

**Analogies:**
- `package.json` from Node.js
- `Gemfile` from Rails
- `Cargo.toml` from Rust

**Annotation glossary:**
- `<parent>` — "I want to inherit all the defaults from Spring Boot 3.4.0" (like extending a base class)
- `<dependencies>` — "These are the libraries my code needs to compile and run"

**Key sections:**

```xml
<parent>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.0</version>
</parent>
```
This is the most important line. `spring-boot-starter-parent` is like a template that includes:
- Pre-configured Maven plugins
- Pre-defined dependency versions (so you don't specify version numbers for most Spring dependencies)
- Java compilation settings
- Test framework configuration

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```
`spring-boot-starter-web` is a "starter" — a bundle of dependencies that together give you:
- Embedded Tomcat server (runs the HTTP server)
- Spring MVC (handles routing)
- Jackson (converts Java objects ←→ JSON)
- Validation support

It's like `npm install express` + `npm install body-parser` + `npm install cors` all at once.

**Maven Coordinates** are like npm package names:
- `groupId` = organization (like `@angular/core` scope)
- `artifactId` = package name (like `core`)
- `version` = version number

## 3.2 `MealPlannerApplication.java` — The Entry Point

```java
package com.mealplanner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MealPlannerApplication {
    public static void main(String[] args) {
        SpringApplication.run(MealPlannerApplication.class, args);
    }
}
```

**What it does:** This is the `main()` method — the very first code that runs when you start the backend.

**It's equivalent to:**
- `rails server` (in Rails)
- `npm start` in a Node.js project
- The `main()` function in any program

**What `@SpringBootApplication` does (three things in one):**
1. `@Configuration` — "This class can define beans (like a module that exports things)"
2. `@EnableAutoConfiguration` — "Spring, figure out what libraries I have and configure them automatically" (e.g., since it sees `spring-boot-starter-web`, it starts the embedded Tomcat server)
3. `@ComponentScan` — "Spring, scan all files in the `com.mealplanner` package and find everything with `@Component`, `@Service`, `@Controller`, `@Repository`"

**What `SpringApplication.run(...)` does:**
1. Starts the embedded Tomcat server on port 8080
2. Scans for Spring Beans (all `@Service`, `@Controller`, `@Repository`, etc.)
3. Wires them together via dependency injection
4. Starts accepting HTTP requests

**package com.mealplanner;**
- Every Java file starts with a `package` declaration.
- It's like a folder/namespace. `com.mealplanner.recipe.RecipeService` is the fully qualified name.
- Packages prevent naming conflicts (two classes named `Recipe` in different packages are fine).

## 3.3 `application.properties` — Configuration

```properties
spring.application.name=meal-planner-api
server.port=8080
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/mealplanner}
spring.datasource.username=${DATABASE_USERNAME:postgres}
spring.datasource.password=${DATABASE_PASSWORD:postgres}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=true
gemini.api.key=${GEMINI_API_KEY:your-gemini-api-key-here}
```

**What it does:** Key-value configuration for the entire backend.

**Analogies:**
- Rails `config/database.yml` + `config/application.yml`
- Next.js `.env.local`
- Docker `environment` variables

**Each line explained:**

| Property | Meaning |
|---|---|
| `spring.application.name` | Name of the app (shows in logs, monitoring) |
| `server.port=8080` | Run the HTTP server on port 8080 |
| `spring.datasource.url` | Database connection string (JDBC format, not the URI format you might know) |
| `spring.jpa.hibernate.ddl-auto=update` | **Auto-create database tables** based on entities. `update` = add columns if the entity has new fields, but don't delete existing data |
| `spring.jpa.show-sql=true` | Log every SQL query to the console (great for learning!) |
| `gemini.api.key` | Our custom property — injected via `@Value("${gemini.api.key}")` |

**The `${...}` syntax:**
- `$` reads environment variables
- `${DATABASE_URL:jdbc:postgresql://localhost:5432/mealplanner}` = "read the `DATABASE_URL` environment variable; if not set, use `jdbc:postgresql://localhost:5432/mealplanner` as default"
- This is like `ENV.fetch('DATABASE_URL', 'jdbc:...')` in Ruby, or `process.env.DATABASE_URL || 'jdbc:...'` in Node.js

## 3.4 `Recipe.java` — The Entity (Database Table)

**What it does:** Defines the `recipes` database table structure as a Java class.

**Analogies:**
- Rails `app/models/recipe.rb` + the migration file combined
- A Prisma schema `model Recipe { ... }`
- A TypeORM `@Entity()` class

**Every annotation explained:**

```java
@Entity                          // "This class is a database table"
@Table(name = "recipes")         // "The table name in the DB is 'recipes'"
public class Recipe {

    @Id                          // "This field is the primary key"
    @GeneratedValue(strategy = GenerationType.IDENTITY)
                                 // "Auto-increment: the DB assigns the ID"
    private Long id;

    @Column(nullable = false)    // "NOT NULL constraint in the database"
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
                                 // "Use TEXT type instead of VARCHAR"
    private String ingredients;  // Stores comma-separated string

    @Column(nullable = false)
    private int estimatedCalories;
```

**Why `Long` (object) vs `long` (primitive):**
- `Long` is an object (can be `null`). Used for IDs because a new recipe doesn't have an ID yet.
- `int` is a primitive (cannot be `null`). Used for calories because it always has a value.
- Primitives (`int`, `boolean`, `double`) are faster and use less memory.
- Objects (`Long`, `Integer`, `Boolean`, `Double`) can be `null` and have methods.

**Why ingredients is a single `String`, not a `List<String>`:**
- JPA does not natively support lists in a single column.
- We store ingredients as `"chicken,broccoli,rice"` (comma-separated).
- We split the string when we need to work with individual ingredients.
- Alternative: You could use a separate `Ingredient` table with a foreign key.

**The two constructors:**
```java
public Recipe() {}  // No-arg constructor — required by JPA/Hibernate
                    // Hibernate uses this when loading from DB
                    // Sets fields by calling setters directly

public Recipe(String name, String ingredients, int estimatedCalories) {
    // Parameterized constructor — we use this when creating new recipes in code
    this.name = name;
    this.ingredients = ingredients;
    this.estimatedCalories = estimatedCalories;
}
```

**Why both constructors?**
- JPA needs the no-arg constructor to create objects from database results.
- We need the parameterized constructor for convenience when creating objects in business logic.

## 3.5 `RecipeRepository.java` — The Database Access Layer

```java
package com.mealplanner.recipe;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
}
```

**What it does:** Provides all CRUD operations for the `Recipe` entity without writing any implementation code.

**This is MAGIC — here's why:**
- `JpaRepository<Recipe, Long>` is a **generic interface** — it's a template.
- `<Recipe, Long>` means: "I want CRUD operations for `Recipe` entities whose primary key is `Long`."
- Spring Data JPA automatically **generates the implementation** at runtime.
- It's like a Rails concern/mixin that adds `find`, `create`, `update`, `delete` methods.

**Methods you get for free:**
```java
recipeRepository.findAll();                          // → List<Recipe>
recipeRepository.findById(1L);                       // → Optional<Recipe>
recipeRepository.save(recipe);                       // → Recipe (insert or update)
recipeRepository.deleteById(1L);                     // → void
recipeRepository.count();                             // → long
recipeRepository.existsById(1L);                     // → boolean
```

**The `Optional<T>` return type:**
- `findById` returns `Optional<Recipe>` — a wrapper that might contain a Recipe or might be empty.
- It's like `T | undefined` in TypeScript, but with methods like `.isPresent()` and `.orElseThrow()`.
- `.orElseThrow(() -> new RuntimeException("Not found"))` = "if the recipe doesn't exist, throw an error" (like throwing an exception if `null`).

**Custom query derivation:**
```java
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {
    List<MealPlan> findByMealDateBetween(LocalDate start, LocalDate end);
    List<MealPlan> findByMealDate(LocalDate date);
}
```

Spring parses the method name:
- `findBy` → SELECT
- `MealDate` → WHERE meal_date
- `Between` → BETWEEN ? AND ? (two parameters)
- `(LocalDate start, LocalDate end)` → the two parameters

The generated SQL:
```sql
SELECT * FROM meal_plans WHERE meal_date BETWEEN ? AND ?
```

## 3.6 `RecipeRequest.java` — The API Request Shape

```java
package com.mealplanner.recipe;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RecipeRequest(
        @NotNull @NotEmpty String name,
        @NotNull @NotEmpty List<String> ingredients
) {}
```

**What it does:** Defines the shape of the JSON body that the Angular frontend sends when creating a recipe.

**Why a record and not a class:**
- Records are designed for "nominal data carriers" — objects that just hold data and do nothing else.
- They're immutable (fields are `final` — cannot be changed after creation).
- They auto-generate: constructor, `equals()`, `hashCode()`, `toString()`.
- They're perfect for API request/response objects.

**When the Angular app sends:**
```json
{
  "name": "Chicken Stir Fry",
  "ingredients": ["chicken", "broccoli", "soy sauce"]
}
```

Spring Jackson automatically creates:
```java
new RecipeRequest("Chicken Stir Fry", List.of("chicken", "broccoli", "soy sauce"))
```

**What `@Valid` does in the controller:**
```java
public ResponseEntity<CalorieEstimation> estimateCalories(
    @Valid @RequestBody RecipeRequest request
)
```
The `@Valid` triggers validation: if `name` is null or `ingredients` is empty, Spring returns HTTP 400 with error details automatically.

## 3.7 `CalorieEstimation.java` — The API Response Shape

```java
public record CalorieEstimation(
        int estimatedCalories,
        String summary
) {}
```

**What it does:** Defines the JSON response shape returned from the calorie estimation endpoint.

**When the controller returns:**
```java
return ResponseEntity.ok(new CalorieEstimation(450, "Based on standard portions."));
```

Angular receives:
```json
{
  "estimatedCalories": 450,
  "summary": "Based on standard portions."
}
```

Spring Jackson automatically converts `estimatedCalories` to `estimatedCalories` (field name becomes the JSON key).

## 3.8 `RecipeService.java` — The Business Logic

**This is the most important file to understand.**

```java
@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public RecipeService(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
        this.restTemplate = new RestTemplate();
    }
```

**`@Service`:** Marks this class as a Spring-managed bean (like a singleton service in Angular). Spring creates one instance and shares it across the app.

**Constructor injection:** Spring sees `RecipeService(RecipeRepository recipeRepository)` and automatically provides the `RecipeRepository` instance. This is how dependency injection works — Spring wires objects together.

**`@Value("${gemini.api.key}")`:** Injects the value of `gemini.api.key` from `application.properties`. Like `process.env.GEMINI_API_KEY` in Node.js.

**`RestTemplate`:** Java's built-in HTTP client (like `fetch` in JavaScript or `HTTParty` in Ruby). We use it to call the Gemini API.

### The `estimateCalories` method — step by step:

```java
public CalorieEstimation estimateCalories(RecipeRequest request) {
    // Step 1: Convert ingredients list to a comma-separated string
    String ingredients = String.join(", ", request.ingredients());
    // Result: "chicken, broccoli, soy sauce"

    // Step 2: Build a prompt for Gemini
    String prompt = "Estimate the total calories for a meal with these ingredients: "
            + ingredients
            + ". Respond with only JSON: {\"totalCalories\": <number>, \"summary\": \"...\"}";

    // Step 3: Build the Gemini API URL
    String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
            + geminiApiKey;

    // Step 4: Build the request body (Gemini's JSON format)
    String requestBody = """
            {
                "contents": [{"parts": [{"text": "%s"}]}]
            }
            """.formatted(prompt);
    // """ is a text block — Java 15+ feature for multi-line strings

    // Step 5: Make the HTTP POST request
    String response = restTemplate.postForObject(url, requestBody, String.class);

    // Step 6: Parse the response and return
    return parseResponse(response != null ? response : "{}");
}
```

**`String.join(", ", request.ingredients())`:** Joins a list into a string. Equivalent to TypeScript: `request.ingredients.join(", ")`.

**Text blocks (`""" ... """`):** Java 15+ feature for multi-line strings (like template literals `` `...` `` in JavaScript).

**`restTemplate.postForObject(url, requestBody, String.class)`:** Sends a POST request and returns the response body as a `String`.

### The `createRecipe` method:

```java
public Recipe createRecipe(RecipeRequest request, int estimatedCalories) {
    Recipe recipe = new Recipe(
            request.name(),                    // → get name from record
            String.join(",", request.ingredients()),  // → join list into comma-separated
            estimatedCalories
    );
    return recipeRepository.save(recipe);     // → INSERT INTO recipes
}
```

### The `parseResponse` method:

```java
private CalorieEstimation parseResponse(String response) {
    // This is manual JSON parsing (no library)
    // Gemini returns complex JSON, we extract the text field
    // then find "totalCalories": 450 and "summary": "..."

    try {
        // Find the "text" field in Gemini's response
        if (text.contains("\"text\"")) {
            int start = text.indexOf("\"text\"") + 7;
            // ... character-by-character parsing
            int calories = Integer.parseInt(extractedNumber);
            String summary = extractedSummary;
            return new CalorieEstimation(calories, summary);
        }
    } catch (Exception ignored) {
        // If anything goes wrong, return default
    }
    return new CalorieEstimation(0, "Could not estimate calories");
}
```

In production, you'd use a JSON library (like Jackson's `ObjectMapper`). I kept it manual so you can see string manipulation in Java:
- `indexOf()` — find position of a substring (JavaScript equivalent: `indexOf()`)
- `substring(start, end)` — extract part of string (JavaScript: `substring()`)
- `Integer.parseInt(str)` — convert string to int (JavaScript: `parseInt()`)

## 3.9 `RecipeController.java` — The HTTP Router

```java
@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(recipeService.getAllRecipes());
    }

    @PostMapping
    public ResponseEntity<Recipe> createRecipe(@Valid @RequestBody RecipeRequest request) {
        CalorieEstimation estimation = recipeService.estimateCalories(request);
        Recipe saved = recipeService.createRecipe(request, estimation.estimatedCalories());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/estimate-calories")
    public ResponseEntity<CalorieEstimation> estimateCalories(@Valid @RequestBody RecipeRequest request) {
        CalorieEstimation estimation = recipeService.estimateCalories(request);
        return ResponseEntity.ok(estimation);
    }
}
```

**What it does:** Maps HTTP requests to Java methods. Like Rails routes combined with Rails controllers.

**`@RestController`:**
- `@Controller` = "this class handles HTTP requests"
- `@ResponseBody` = "return JSON, not a view template"
- Combined: every method automatically serializes its return value to JSON

**`@RequestMapping("/api/recipes")` on the class:**
- Every method in this controller starts with `/api/recipes`
- Like Rails `resources :recipes` or Express `router.use('/api/recipes', recipeRouter)`

**Each method:**

| Annotation | HTTP Method + Path | Rails Equivalent |
|---|---|---|
| `@GetMapping` | `GET /api/recipes` | `recipes#index` |
| `@PostMapping` | `POST /api/recipes` | `recipes#create` |
| `@PostMapping("/estimate-calories")` | `POST /api/recipes/estimate-calories` | custom route |

**`ResponseEntity<T>`:**
- Wraps the response body with HTTP status code
- `ResponseEntity.ok(body)` → HTTP 200 with body
- `ResponseEntity.status(201).body(body)` → HTTP 201 Created
- `ResponseEntity.noContent().build()` → HTTP 204 No Content
- Like Rails `render json: x, status: :ok`

**`@RequestBody`:**
- Automatically deserializes the JSON request body into a Java object
- Uses Jackson library under the hood (same as `JSON.parse()` in JavaScript)

**`@Valid`:**
- Triggers validation on the request body
- If validation fails, Spring returns HTTP 400 automatically

**`@PathVariable`:**
- Extracts a value from the URL path
- `@DeleteMapping("/{id}")` with `@PathVariable Long id` extracts `id` from `/api/meal-plans/5`

**`@RequestParam`:**
- Extracts a query parameter from the URL
- `GET /api/meal-plans/week?weekStart=2026-06-15` → `@RequestParam LocalDate weekStart`

## 3.10 `MealType.java` — The Enum

```java
public enum MealType {
    BREAKFAST,
    LUNCH,
    DINNER
}
```

**What it does:** Defines the three meal times as a type-safe enum.

**Why not just use a string?**
```java
// This compiles but is WRONG — "BReakfast" typo won't be caught
String mealType = "BReakfast";

// This DOESN'T compile — Java catches the typo at compile time
MealType mealType = MealType.BREAKFAST;  // ✓ correct
MealType mealType = MealType.BREKFAST;    // ✗ compile error!
```

**Usage in the entity:**
```java
@Enumerated(EnumType.STRING)  // Store as "BREAKFAST" in DB, not 0
@Column(name = "meal_type", nullable = false)
private MealType mealType;
```

`EnumType.STRING` stores `"BREAKFAST"` (the name). `EnumType.ORDINAL` (default) stores `0` (the position). We use STRING because it's readable and survives enum reordering.

## 3.11 `MealPlan.java` — The Entity with a Relationship

```java
@Entity
@Table(name = "meal_plans")
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meal_date", nullable = false)
    private LocalDate mealDate;            // Java's modern date API

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false)
    private MealType mealType;

    @ManyToOne(fetch = FetchType.LAZY)     // Many meal_plans → One recipe
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;
```

**What's new here that wasn't in Recipe.java:**

**`@ManyToOne`:**
- Many `MealPlan` records can reference the same `Recipe`.
- Like Rails `belongs_to :recipe`.
- Creates a foreign key relationship in the database.

**`@JoinColumn(name = "recipe_id")`:**
- Specifies the foreign key column name in the `meal_plans` table.
- The database will have `meal_plans.recipe_id → recipes.id`.

**`fetch = FetchType.LAZY`:**
- Performance optimization. When you load a `MealPlan`, the associated `Recipe` is NOT loaded from the database until you actually access `mealPlan.getRecipe()`.
- Lazy = load on demand (like Rails `includes` or `eager_load`).
- Eager (`FetchType.EAGER`) = always load the relationship with a JOIN.

**`LocalDate`:**
- Java 8+ date API. Represents a date without time (2026-06-15).
- Unlike JavaScript `Date`, which always includes time.
- Replaces the old `java.util.Date` and `java.util.Calendar` classes.

## 3.12 `MealPlanService.java` — Date Logic + Combining Services

```java
@Service
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final RecipeService recipeService;

    public MealPlanService(MealPlanRepository mealPlanRepository, RecipeService recipeService) {
        this.mealPlanRepository = mealPlanRepository;
        this.recipeService = recipeService;
    }

    public List<MealPlan> getWeekPlan(LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        return mealPlanRepository.findByMealDateBetween(weekStart, weekEnd);
    }
```

**What's new:**
- This service depends on **two** other beans: `MealPlanRepository` and `RecipeService`.
- Spring injects both through the constructor.
- The `MealPlanService` coordinates between them: it uses `RecipeService` to find a recipe by ID, then creates a `MealPlan` with it.

**`LocalDate.plusDays(6)`:**
- Immutable — returns a new LocalDate, doesn't modify the original.
- Equivalent to `date-fns` `addDays(monday, 6)`.

**The `createMealPlan` method:**
```java
public MealPlan createMealPlan(MealPlanRequest request) {
    // Step 1: Look up the Recipe from its ID
    Recipe recipe = recipeService.findById(request.recipeId());

    // Step 2: Create the MealPlan with the resolved Recipe
    MealPlan mealPlan = new MealPlan(request.mealDate(), request.mealType(), recipe);

    // Step 3: Save to database
    return mealPlanRepository.save(mealPlan);
}
```

This is the essence of a Service layer: coordinating between different components to perform a business operation.

## 3.13 `MealPlanController.java` — Week-Based Queries

```java
@GetMapping("/week")
public ResponseEntity<List<MealPlan>> getWeekPlan(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate weekStart) {
    return ResponseEntity.ok(mealPlanService.getWeekPlan(weekStart));
}
```

**`@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)`:**
- Specifies how to parse the date query parameter.
- Expects the format `2026-06-15` (ISO 8601).
- Without this, Spring wouldn't know how to convert the string to a `LocalDate`.

**Usage:**
- Angular calls: `GET /api/meal-plans/week?weekStart=2026-06-15`
- The controller receives `LocalDate weekStart = 2026-06-15`
- The service computes `weekEnd = weekStart.plusDays(6)` → `2026-06-21`
- The repository executes: `SELECT * FROM meal_plans WHERE meal_date BETWEEN '2026-06-15' AND '2026-06-21'`

## 3.14 `GroceryService.java` — The Streams API in Action

**This is the file that best demonstrates Java's Streams API.**

```java
public List<String> generateGroceryList(LocalDate weekStart) {
    // Step 1: Get all MealPlans for the week
    List<MealPlan> weekPlans = mealPlanService.getWeekPlan(weekStart);

    // Step 2: Stream pipeline
    return weekPlans.stream()                              // Start streaming
            .map(MealPlan::getRecipe)                      // Extract Recipe from each MealPlan
            .map(Recipe::getIngredients)                   // Extract ingredients string from each Recipe
            .flatMap(ingredients ->                         // Split each string into individual ingredients
                    Arrays.stream(ingredients.split(",")))  // and flatten into single stream
            .map(String::trim)                              // Remove whitespace
            .map(String::toLowerCase)                       // Standardize to lowercase
            .distinct()                                     // Remove duplicates (like [...new Set()])
            .sorted()                                       // Sort alphabetically
            .toList();                                      // Collect results into a List
}
```

**Visual trace of the pipeline:**

For a week with plans for "Chicken Stir Fry" and "Pasta":

```
Start: [MealPlan(recipe: "Chicken Stir Fry"), MealPlan(recipe: "Pasta")]
  │
  .map(MealPlan::getRecipe)
  ▼
  [Recipe("Chicken Stir Fry", "chicken,broccoli,soy sauce"),
   Recipe("Pasta", "pasta,tomato sauce,garlic")]
  │
  .map(Recipe::getIngredients)
  ▼
  ["chicken,broccoli,soy sauce", "pasta,tomato sauce,garlic"]
  │
  .flatMap(ingredients -> Arrays.stream(ingredients.split(",")))
  ▼
  ["chicken", "broccoli", "soy sauce", "pasta", "tomato sauce", "garlic"]
  │
  .map(String::trim)
  .map(String::toLowerCase)
  ▼
  ["chicken", "broccoli", "soy sauce", "pasta", "tomato sauce", "garlic"]
  │
  .distinct()
  .sorted()
  ▼
  ["broccoli", "chicken", "garlic", "pasta", "soy sauce", "tomato sauce"]
```

## 3.15 `CorsConfig.java` — Security Configuration

```java
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:4200", "https://*.vercel.app")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
```

**What it does:** Allows the Angular frontend (on a different port) to call the Java backend.

**CORS problem explained:**
- Your Angular app runs at `http://localhost:4200`
- Your Spring Boot backend runs at `http://localhost:8080`
- Browsers block HTTP requests from `localhost:4200` to `localhost:8080` by default (different origin = different port)
- CORS tells the browser: "It's OK, this backend allows requests from the frontend."

**`@Configuration` + `@Bean`:**
- `@Configuration` = "this class defines beans"
- `@Bean` = "this method returns a bean that Spring should manage"
- Together: "Spring, call this method and use the returned object wherever it's needed"

**`allowedOrigins("http://localhost:4200", "https://*.vercel.app")`:**
- Allow requests from these origins
- `http://localhost:4200` = Angular dev server
- `https://*.vercel.app` = any Vercel deployment (production)

---

# 4. Every Frontend File Explained

## 4.1 Models (`recipe.model.ts`, `meal-plan.model.ts`)

```typescript
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

**What they do:** Define the exact shape of data coming from and going to the Java backend.

**Key observation:** These TypeScript interfaces mirror the Java Records exactly:
- TypeScript `Recipe` ↔ Java `Recipe` entity
- TypeScript `RecipeRequest` ↔ Java `RecipeRequest` record
- TypeScript `CalorieEstimation` ↔ Java `CalorieEstimation` record

**Why both `Recipe` and `RecipeRequest`?**
- `RecipeRequest` (with `ingredients: string[]`) is what the user fills in the form — an array of ingredients.
- `Recipe` (with `ingredients: string`) is what comes back from the backend — a comma-separated string.
- The backend converts between these two representations.

## 4.2 Services (`recipe.service.ts`, `meal-plan.service.ts`, `grocery.service.ts`)

```typescript
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
}
```

**What they do:** Centralize all HTTP calls to the backend API.

**`@Injectable({ providedIn: 'root' })`:**
- "This service is a singleton — one instance shared across the app"
- Like Angular's version of dependency injection
- Equivalent to: React Context + Provider, or a Rails concern

**`HttpClient`:**
- Angular's built-in HTTP client (like `axios` or `fetch`)
- Injected via constructor: `constructor(private http: HttpClient) {}`
- Returns `Observable<T>` instead of `Promise<T>`

**`Observable<T>` vs `Promise<T>`:**
- `Promise`: represents ONE future value. You use `.then()` or `await`.
- `Observable`: represents a STREAM of values over time. You use `.subscribe()`.
- For HTTP calls, `Observable` is like `Promise` — it emits once and completes.
- Angular uses Observables (from RxJS) instead of Promises because they're more powerful (cancellable, retryable, pipeable).

**The URL pattern:**
```typescript
private apiUrl = `${isDevMode() ? 'http://localhost:8080' : 'https://your-render-backend.onrender.com'}/api/recipes`;
```

- `isDevMode()` returns `true` during `ng serve` (local development)
- Returns `false` when the app is built with `--configuration production`
- This automatically switches between local backend and production backend

**`HttpParams`:**
```typescript
getWeek(weekStart: string): Observable<MealPlan[]> {
    const params = new HttpParams().set('weekStart', weekStart);
    return this.http.get<MealPlan[]>(`${this.baseUrl}/week`, { params });
}
```
- Builds query parameters for the URL
- `params.set('weekStart', '2026-06-15')` → `?weekStart=2026-06-15`

**RxJS `pipe` + `map`:**
```typescript
getList(weekStart: string): Observable<GroceryItem[]> {
    return this.http.get<string[]>(this.apiUrl, { params }).pipe(
      map(items => items.map(name => ({ name, checked: false })))
    );
}
```
- `pipe(map(...))` — transforms the emitted value
- The backend returns `string[]` (just ingredient names)
- We transform each string into a `{ name, checked }` object
- Like `.then(data => data.map(...))` with Promises

## 4.3 Components (`recipes.component.ts`, `weekly-calendar.component.ts`, etc.)

```typescript
@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, /* ... */],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.css'
})
export class RecipesComponent implements OnInit {
  recipes: Recipe[] = [];
  name = '';
  ingredients: string[] = [];
  estimation: CalorieEstimation | null = null;
  loading = false;

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.recipeService.getAll().subscribe(data => this.recipes = data);
  }
```

**`@Component({ standalone: true })`:**
- Angular 17+ feature. No NgModule needed.
- Each component explicitly declares its dependencies in `imports`.
- Like a React component that imports what it needs.

**`implements OnInit`:**
- An interface. Means "this component has an `ngOnInit()` method."
- `ngOnInit()` runs once when the component is created (like React `useEffect(() => {}, [])`)
- `constructor()` sets up injection; `ngOnInit()` starts data loading

**Template syntax (Angular 17+ control flow):**
```html
@if (ingredients.length > 0) {
  <mat-chip-set>
    @for (ing of ingredients; track ing) {
      <mat-chip [removable]="true" (removed)="removeIngredient(ing)">
        {{ ing }}
      </mat-chip>
    }
  </mat-chip-set>
}
```

- `@if` = `*ngIf` in older Angular, or ternary in React
- `@for` = `*ngFor` in older Angular, or `.map()` in React
- `track ing` = `key={ing}` in React (optimizes re-rendering)
- `[removable]` = property binding (like React `removable={true}`)
- `(removed)` = event binding (like React `onRemoved={...}`)
- `{{ ing }}` = interpolation (like React `{ing}`)

**Two-way binding `[(ngModel)]`:**
```html
<input matInput [(ngModel)]="name" placeholder="e.g. Chicken Stir Fry" />
```
- `[(ngModel)]="name"` = two-way binding
- Changes to the input update `component.name`
- Changes to `component.name` update the input
- Like React: `value={name} onChange={e => setName(e.target.value)}`

**`$event` in Angular:**
```html
<button (click)="removeMealPlan(plan.id); $event.stopPropagation()">
```
- `$event` is the browser's native event object
- `$event.stopPropagation()` prevents the click from bubbling up to parent elements

## 4.4 The Recipe Picker Dialog

```typescript
@Component({
  template: `
    <h2 mat-dialog-title>Pick a Recipe</h2>
    <mat-dialog-content>
      <mat-nav-list>
        @for (recipe of data.recipes; track recipe.id) {
          <mat-list-item (click)="select(recipe.id)">
            <span matListItemTitle>{{ recipe.name }}</span>
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
```

**What it does:** A modal dialog that opens when the user clicks a cell in the weekly calendar.

**`MAT_DIALOG_DATA`:** Angular Material provides the data passed from `dialog.open(component, { data: ... })` through this injection token.

**`dialogRef.close(recipeId)`:** Closes the dialog and returns `recipeId` to the parent component. The parent awaits this via `afterClosed()`.

---

# 5. End-to-End Walkthroughs

## 5.1 "Estimate Calories" — Full Trace

```
Browser                        Angular                       Java Backend
──────                         ───────                       ───────────
User types recipe name
and ingredients
     │
     ▼
User clicks
"Estimate Calories"
     │
     ├─► RecipesComponent
     │   .estimateCalories()
     │       │
     │       ▼
     │   RecipeService
     │   .estimateCalories({
     │     name: "Chicken Stir Fry",
     │     ingredients: ["chicken","broccoli","rice"]
     │   })
     │       │
     │       ▼
     │   http.post(
     │     "http://localhost:8080/api/recipes/estimate-calories",
     │     { name, ingredients }
     │   )
     │       │
     │       │  ─── POST ──►  RecipeController
     │       │                .estimateCalories(request)
     │       │                    │
     │       │                    ▼
     │       │                RecipeService
     │       │                .estimateCalories(request)
     │       │                    │
     │       │                    ▼
     │       │                Builds prompt:
     │       │                "Estimate calories for:
     │       │                 chicken, broccoli, rice"
     │       │                    │
     │       │                    ▼
     │       │                RestTemplate.postForObject(
     │       │                  "https://generativelanguage.googleapis.com/..."
     │       │                )
     │       │                    │
     │       │                    ├──► Gemini AI
     │       │                    │    ──► Returns JSON:
     │       │                    │    { "totalCalories": 450, "summary": "..." }
     │       │                    │
     │       │                    ▼
     │       │                parseResponse()
     │       │                    │
     │       │                    ▼
     │       │                CalorieEstimation(450, "Standard portions")
     │       │                    │
     │       │                    ▼
     │       │                ResponseEntity.ok(estimation)
     │       │                    │
     │       │  ◄─── HTTP 200 ───┘
     │       │  { estimatedCalories: 450, summary: "..." }
     │       │
     │       ▼
     │   this.estimation = data
     │       │
     │       ▼
     │   UI shows:
     │   "450 kcal"
     │   "Based on standard portions"
```

## 5.2 "Save Recipe" — Full Trace

```
User clicks "Save Recipe"
     │
     ├─► RecipesComponent.saveRecipe()
     │       │
     │       ▼
     │   RecipeService.create({
     │     name: "Chicken Stir Fry",
     │     ingredients: ["chicken","broccoli","rice"]
     │   })
     │       │
     │       ▼
     │   POST /api/recipes
     │       │
     │       ├──► RecipeController.createRecipe(request)
     │       │       │
     │       │       ▼
     │       │   RecipeService.estimateCalories(request)
     │       │       → returns CalorieEstimation(450, "...")
     │       │       │
     │       │       ▼
     │       │   RecipeService.createRecipe(request, 450)
     │       │       │
     │       │       ▼
     │       │   new Recipe("Chicken Stir Fry",
     │       │              "chicken,broccoli,rice", 450)
     │       │       │
     │       │       ▼
     │       │   recipeRepository.save(recipe)
     │       │       │
     │       │       ▼
     │       │   Hibernate generates:
     │       │   INSERT INTO recipes
     │       │   (name, ingredients, estimated_calories)
     │       │   VALUES ('Chicken Stir Fry',
     │       │           'chicken,broccoli,rice', 450)
     │       │       │
     │       │       ▼
     │       │   Returns saved Recipe (with id=1)
     │       │
     │       ◄─── HTTP 200: Recipe JSON ────┘
     │
     ▼
     recipes.push(recipe)
     → UI updates with new recipe in the list
     → Form resets to blank
```

## 5.3 "Generate Grocery List" — Full Trace

```
User navigates to Grocery List page
     │
     ├─► GroceryListComponent.ngOnInit()
     │       │
     │       ▼
     │   weekStart = "2026-06-15" (this Monday)
     │       │
     │       ▼
     │   GroceryService.getList("2026-06-15")
     │       │
     │       ▼
     │   GET /api/grocery-list?weekStart=2026-06-15
     │       │
     │       ├──► GroceryController.getGroceryList(weekStart)
     │       │       │
     │       │       ▼
     │       │   GroceryService.generateGroceryList(weekStart)
     │       │       │
     │       │       ▼
     │       │   MealPlanService.getWeekPlan(weekStart)
     │       │       → List<MealPlan> for the week
     │       │       │
     │       │       ▼
     │       │   STREAMS PIPELINE:
     │       │   weekPlans.stream()
     │       │     .map(MealPlan::getRecipe)
     │       │     .map(Recipe::getIngredients)
     │       │     .flatMap(i → Arrays.stream(i.split(",")))
     │       │     .map(String::trim)
     │       │     .map(String::toLowerCase)
     │       │     .distinct()
     │       │     .sorted()
     │       │     .toList()
     │       │       │
     │       │       ▼
     │       │   ["broccoli", "chicken", "garlic",
     │       │    "pasta", "rice", "soy sauce", "tomato sauce"]
     │       │
     │       ◄─── HTTP 200: JSON array ──────────┘
     │
     ▼
     Transform each string into { name, checked: false }
     → [{ name: "broccoli", checked: false }, ...]
     → UI shows list with checkboxes
```

---

# 6. Key Java Concepts for Your Job

## 6.1 Annotations (the `@` sign)

**What they are:** Metadata attached to code. They tell Spring/Java extra information about a class, method, or field.

**Analogy:** TypeScript/JavaScript decorators (`@Component`, `@Injectable`, `@Input`). Same concept.

**Most common annotations in this project:**

| Annotation | What It Means | Used On |
|---|---|---|
| `@SpringBootApplication` | "This is the entry point of a Spring Boot app" | `MealPlannerApplication` class |
| `@RestController` | "This class handles HTTP requests and returns JSON" | Controllers |
| `@RequestMapping("/api/x")` | "All routes in this class start with /api/x" | Controller class |
| `@GetMapping` | "This method handles GET requests" | Controller method |
| `@PostMapping` | "This method handles POST requests" | Controller method |
| `@DeleteMapping("/{id}")` | "This method handles DELETE requests" | Controller method |
| `@RequestBody` | "Convert the HTTP request body to a Java object" | Controller parameter |
| `@PathVariable` | "Extract this value from the URL path" | Controller parameter |
| `@RequestParam` | "Extract this value from the query string" | Controller parameter |
| `@Valid` | "Validate this object using its validation annotations" | Controller parameter |
| `@Service` | "This class contains business logic" | Service class |
| `@Entity` | "This class maps to a database table" | Entity class |
| `@Table(name = "x")` | "The database table name is x" | Entity class |
| `@Id` | "This field is the primary key" | Entity field |
| `@GeneratedValue` | "Auto-generate the primary key value" | Entity field |
| `@Column(name = "x")` | "This field maps to column x in the table" | Entity field |
| `@ManyToOne` | "Many of these entities belong to one of the other entity" | Entity field |
| `@JoinColumn(name = "fk")` | "The foreign key column is fk" | Entity field |
| `@Enumerated(STRING)` | "Store the enum as a string in the DB" | Entity field |
| `@Configuration` | "This class defines Spring beans" | Config class |
| `@Bean` | "This method returns a Spring-managed object" | Config method |
| `@Value("${key}")` | "Inject the value of config key into this field" | Service field |
| `@NotNull` | "This value cannot be null" | Record field |
| `@NotEmpty` | "This string/list cannot be empty" | Record field |
| `@Override` | "This method overrides a parent class method" | Any method |
| `@Autowired` | *optional* "Inject this dependency" (implicit in constructor) | Constructor |

## 6.2 Dependency Injection

**What it is:** Instead of creating objects manually with `new`, Spring creates all objects and gives them to each other when needed.

**Without DI (what you'd have to do):**
```java
public class RecipeController {
    private RecipeService recipeService;

    public RecipeController() {
        // We have to create everything manually
        RecipeRepository repo = new RecipeRepository(); // won't work — it's an interface!
        this.recipeService = new RecipeService(repo);
    }
}
```

**With DI (what we actually do):**
```java
public class RecipeController {
    private final RecipeService recipeService;

    // Spring automatically finds the RecipeService bean and passes it here
    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }
}
```

**The flow:**
1. Application starts
2. Spring scans all files for `@Service`, `@Controller`, `@Repository`, `@Component`
3. Spring creates one instance of each (these are called "beans")
4. Spring looks at constructors and "injects" the required beans
5. Everything is wired together automatically

**Analogy:** It's exactly like Angular's DI. Your Angular components don't `new RecipeService()` — the constructor receives it. Same concept in Spring.

**Why `private final`?**
- `private`: Only this class can access it
- `final`: Once set, cannot be changed. It's a contract: "this service will never be swapped out"

## 6.3 Maven Build Lifecycle

**What it is:** Maven has a standard sequence of build phases. When you run `mvn <phase>`, it runs all phases before it too.

```
mvn compile   → runs: validate, compile
mvn test      → runs: validate, compile, test
mvn package   → runs: validate, compile, test, package
mvn install   → runs: validate, compile, test, package, install
mvn deploy    → runs: validate, compile, test, package, install, deploy
```

**Common commands you'll use:**
- `mvn clean compile` — Delete old compiled files, then compile
- `mvn clean test` — Compile and run tests
- `mvn clean package -DskipTests` — Build the JAR file without running tests
- `mvn spring-boot:run` — Compile and run the application (special Spring Boot plugin goal)
- `mvn clean` — Delete all compiled files and the `target/` directory

**The output:** `mvn package` creates a `.jar` file in `target/`. This JAR is a self-contained executable that includes the embedded Tomcat server. Run it with `java -jar target/meal-planner-api-0.0.1-SNAPSHOT.jar`.

## 6.4 Generics `<T>`

**What they are:** Type parameters — they make classes work with any type while maintaining type safety.

**Like TypeScript generics:**
```typescript
// TypeScript
class Box<T> {
  value: T;
}
const box = new Box<number>();
box.value = 5;  // OK
box.value = "hello";  // Error!
```

```java
// Java
// JpaRepository works with any entity type
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    // Recipe = entity type
    // Long = primary key type
}

// You get methods typed correctly:
List<Recipe> findAll();           // Returns List<Recipe>, not List<Object>
Recipe findById(Long id);         // Returns Recipe, not Object
```

**Common generics in the project:**
- `JpaRepository<Recipe, Long>` — Repository for Recipe entities with Long IDs
- `ResponseEntity<CalorieEstimation>` — HTTP response wrapping CalorieEstimation
- `List<MealPlan>` — Type-safe list (you can only put MealPlan objects in it)
- `Optional<Recipe>` — A box that might contain a Recipe or might be empty

## 6.5 The Streams API

**What it is:** A functional programming API for processing collections of data.

**This is THE most important modern Java skill.** At your new job, you will see streams everywhere.

**The pattern:** Collection → `.stream()` → chain operations → `.collect()` or `.toList()`

| Operation | What It Does | JS Equivalent |
|---|---|---|
| `.filter(predicate)` | Keep elements matching the condition | `.filter()` |
| `.map(mapper)` | Transform each element | `.map()` |
| `.flatMap(mapper)` | Flatten nested structures | `.flatMap()` |
| `.distinct()` | Remove duplicates | `[...new Set()]` |
| `.sorted()` | Sort naturally | `.sort()` |
| `.sorted(comparator)` | Sort with custom logic | `.sort((a,b) => ...)` |
| `.limit(n)` | Keep only first n elements | `.slice(0, n)` |
| `.skip(n)` | Skip first n elements | `.slice(n)` |
| `.reduce(identity, accumulator)` | Combine all elements into one | `.reduce()` |
| `.forEach(action)` | Do something for each element | `.forEach()` |
| `.findFirst()` | Get first element (returns Optional) | `.find()` |
| `.anyMatch(predicate)` | Does any element match? | `.some()` |
| `.allMatch(predicate)` | Do all elements match? | `.every()` |
| `.count()` | Count elements | `.length` |
| `.toList()` | Collect into a List | `.map(...)` // just returns array |
| `.collect(Collectors.groupingBy(...))` | Group by a key | `_.groupBy()` |

## 6.6 Exceptions vs Error Handling

**Checked exceptions:** Must be caught with `try/catch` or declared with `throws`.
```java
// Checked exception — compiler forces you to handle it
try {
    Thread.sleep(1000);  // throws InterruptedException
} catch (InterruptedException e) {
    // Handle the error
    Thread.currentThread().interrupt();
}
```

**Unchecked exceptions (RuntimeException):** Don't need to be caught (but can be).
```java
// Unchecked — compiler doesn't force handling
recipeRepository.findById(id)
    .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));
```

**`Optional.orElseThrow()`:** "If the value is present, return it. If not, throw an exception."
- Like: `if (!recipe) throw new Error("Not found")`
- But expressed as a chain

**`try/catch`:** Same as JavaScript:
```java
try {
    // Code that might throw
    int result = riskyOperation();
} catch (SpecificException e) {
    // Handle specific error
    log.error("Something went wrong: " + e.getMessage());
}
```

**`@ControllerAdvice` (not used here, but common):** A centralized error handler for all controllers. Like Express error middleware.

## 6.7 `public`, `private`, `protected` — Access Modifiers

| Modifier | Accessible from |
|---|---|
| `public` | Any class anywhere |
| `private` | Only within the same class |
| `protected` | Same package + subclasses |
| *(default)* | Only same package |

**Common pattern in Java:**
```java
public class RecipeService {       // public = anyone can use this class
    private final RecipeRepository recipeRepository;  // private = only this class
    private final RestTemplate restTemplate;          // can access these fields

    public RecipeService(...) { }   // public constructor = anyone can create (well, Spring does)

    public CalorieEstimation estimateCalories(...) { }   // public = anyone can call
    private CalorieEstimation parseResponse(...) { }      // private = internal helper
}
```

## 6.8 `static` Keyword

**What it means:** Belongs to the class, not to any instance.

```java
public class MathUtils {
    public static int add(int a, int b) {
        return a + b;
    }
}

// Called without creating an instance:
MathUtils.add(2, 3);  // → 5
// Not: new MathUtils().add(2, 3)
```

**Where we use it:**
- `String.join(",", list)` — `join` is a static method on `String`
- `List.of(a, b, c)` — `of` is a static method on `List` interface
- `Arrays.stream(array)` — `stream` is a static method on `Arrays`
- `ResponseEntity.ok(body)` — `ok` is a static method

---

# 7. Practice Exercises

These are ordered by difficulty. Do them in order.

## Exercise 1: Add a `cuisine` Field to Recipe

**Goal:** Add a "cuisine" (e.g., "Italian", "Chinese") field to recipes.

**Files to modify:**
1. `Recipe.java` — add `private String cuisine;` field + getter/setter
2. `RecipeRequest.java` — add `String cuisine` to the record
3. `RecipeService.java` — pass cuisine when creating a Recipe
4. `Angular recipe.model.ts` — add `cuisine?: string` to interfaces
5. `Angular recipes.component.html` — add a cuisine input field

**What this teaches:** Entity changes flow through all layers. You touch the DB, API, and UI.

**Hints:**
- `@Column(nullable = true)` for the new field in Recipe.java
- Add `@NotNull @NotEmpty String cuisine` to RecipeRequest
- In `createRecipe`: `request.name(), String.join(...), request.cuisine(), estimatedCalories`
- In the HTML: add `<mat-form-field>` with `[(ngModel)]="cuisine"` between name and ingredients

## Exercise 2: Add a Search Endpoint

**Goal:** `GET /api/recipes/search?q=chicken` returns recipes matching "chicken" in name or ingredients.

**Files to modify:**
1. `RecipeRepository.java` — add a custom query method
2. `RecipeService.java` — add a `searchRecipes(query)` method
3. `RecipeController.java` — add a `@GetMapping("/search")` endpoint
4. `Angular recipe.service.ts` — add a `search(query)` method
5. `Angular recipes.component.ts` — add search UI logic
6. `Angular recipes.component.html` — add search input

**What this teaches:** Custom repository queries, the `@Query` annotation, URL query parameters.

**Hint:**
```java
// In RecipeRepository.java:
@Query("SELECT r FROM Recipe r WHERE LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(r.ingredients) LIKE LOWER(CONCAT('%', :query, '%'))")
List<Recipe> searchByNameOrIngredients(@Param("query") String query);
```

## Exercise 3: Group Grocery List by Category

**Goal:** Instead of a flat alphabetical list, group ingredients into categories like "Produce", "Meat", "Dairy", "Pantry".

**Files to modify:**
1. `GroceryService.java` — add a mapping of ingredient → category, then use `Collectors.groupingBy()`
2. `GroceryController.java` — update the return type to a grouped structure
3. `Angular grocery-item.model.ts` — add `category` field
4. `Angular grocery-list.component.ts` — group items by category
5. `Angular grocery-list.component.html` — show category group headers

**What this teaches:** `Collectors.groupingBy()`, custom DTOs, UI restructuring.

**Hint in Java:**
```java
Map<String, List<String>> categorized = ingredients.stream()
    .collect(Collectors.groupingBy(this::categorize));

private String categorize(String ingredient) {
    if (List.of("chicken", "beef", "fish").contains(ingredient)) return "Meat";
    if (List.of("broccoli", "spinach", "garlic").contains(ingredient)) return "Produce";
    return "Pantry";
}
```

## Exercise 4: Write a Unit Test

**Goal:** Test the `GroceryService.generateGroceryList()` method.

**New file:** `GroceryServiceTest.java` in `src/test/java/com/mealplanner/grocery/`

**What this teaches:** Spring Boot testing, mocking dependencies, JUnit 5 assertions.

**Hint:**
```java
@SpringBootTest
class GroceryServiceTest {

    @MockBean
    private MealPlanService mealPlanService;

    @Autowired
    private GroceryService groceryService;

    @Test
    void shouldGenerateDeduplicatedSortedList() {
        // Given
        Recipe recipe1 = new Recipe("Pasta", "pasta,tomato,garlic", 400);
        Recipe recipe2 = new Recipe("Salad", "tomato,lettuce", 100);
        MealPlan mp1 = new MealPlan(LocalDate.now(), MealType.LUNCH, recipe1);
        MealPlan mp2 = new MealPlan(LocalDate.now(), MealType.DINNER, recipe2);
        when(mealPlanService.getWeekPlan(any())).thenReturn(List.of(mp1, mp2));

        // When
        List<String> result = groceryService.generateGroceryList(LocalDate.now());

        // Then
        assertThat(result).containsExactly("garlic", "lettuce", "pasta", "tomato");
    }
}
```

## Exercise 5: Add a Recipe Rating Feature (Full Vertical Slice)

**Goal:** Users can rate recipes 1-5 stars.

**What this teaches:** Everything — new entity, new endpoints, new Angular components.

**New files:**
- `backend/.../rating/Rating.java` — Entity (id, recipe_id, value, comment)
- `backend/.../rating/RatingRepository.java`
- `backend/.../rating/RatingService.java`
- `backend/.../rating/RatingController.java`
- `backend/.../rating/RatingRequest.java`
- `Angular rating.model.ts`
- `Angular rating.service.ts`
- `Angular rating component` or integrate into recipes page

---

# 8. Running and Deployment

## 8.1 Local Development

**Backend:**
```powershell
# Set environment variables
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:GEMINI_API_KEY = "your-google-ai-studio-key"

# Add Maven to PATH (only needed in this terminal)
$env:Path = "$HOME\apps\apache-maven-3.9.16\bin;$env:Path"

# Run
cd backend
mvn spring-boot:run
```

The backend starts at `http://localhost:8080`.

Test it:
```powershell
curl -X POST http://localhost:8080/api/recipes/estimate-calories `
  -H "Content-Type: application/json" `
  -d '{"name":"Test","ingredients":["chicken","rice"]}'
```

**Frontend:**
```powershell
cd frontend
ng serve
```

Opens at `http://localhost:4200`.

## 8.2 Deployment

**Frontend → Vercel:**
1. `cd frontend`
2. `vercel` (first time) or `vercel --prod`
3. Vercel auto-detects Angular

**Backend → Render:**
1. Push to GitHub
2. Create new Web Service on render.com
3. Connect your repo
4. Build command: `mvn clean package -DskipTests -f backend/pom.xml`
5. Start command: `java -jar backend/target/meal-planner-api-0.0.1-SNAPSHOT.jar`
6. Add environment variables: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `GEMINI_API_KEY`

**Supabase:**
1. Go to supabase.com → New project
2. In Project Settings → Database → Connection string
3. Copy the URI and set it as `DATABASE_URL` in Render

## 8.3 Common Issues

| Problem | Likely Fix |
|---|---|
| Backend won't start — port in use | Change `server.port` in `application.properties`, or kill the process on port 8080 |
| "No database available" | Supabase is not running or credentials are wrong |
| Gemini returns 403/unauthorized | `GEMINI_API_KEY` is wrong or not set |
| Angular can't reach backend | Check CORS config. In dev, both must be running. |
| Maven build fails | Check you have JAVA_HOME set to Java 21, not Java 11 |
| `mvn` not recognized | Add Maven bin to PATH |
| Database tables not created | Check `spring.jpa.hibernate.ddl-auto=update` is set |

---

> **Final advice:** Java has more ceremony than TypeScript or Ruby — more keywords, more annotations, more files. This is not bad code; it's the language's philosophy of explicitness. Every `@`, every type declaration, every getter/setter is a deliberate statement of intent. The compiler uses this information to catch bugs before they reach production. Your TypeScript muscle memory will serve you well for the concepts (DI, generics, streams), but the syntax will feel verbose for a few weeks. That's normal — it passes.
