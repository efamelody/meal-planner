package com.mealplanner.mealplan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    List<MealPlan> findByMealDateBetween(LocalDate start, LocalDate end);

    List<MealPlan> findByMealDate(LocalDate date);
}
