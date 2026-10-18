
package com.CarbonTrack.backend.dto;

import com.CarbonTrack.backend.entity.ActivityLog;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ActivityResponse(
        Long id,
        String category,
        String activityType,
        BigDecimal quantity,
        String unit,
        BigDecimal co2eKg,
        LocalDate logDate,
        String energySource,
        String mealType,
        BigDecimal servings,
        String productCategory,
        BigDecimal spendAmount,
        String spendCurrency,
        BigDecimal flightDistanceKm
) {
    public static ActivityResponse from(ActivityLog activity) {
        return new ActivityResponse(
                activity.getId(),
                activity.getCategory(),
                activity.getActivityType(),
                activity.getQuantity(),
                activity.getUnit(),
                activity.getCo2eKg(),
                activity.getLogDate(),
                activity.getEnergySource(),
                activity.getMealType(),
                activity.getServings(),
                activity.getProductCategory(),
                activity.getSpendAmount(),
                activity.getSpendCurrency(),
                activity.getFlightDistanceKm()
        );
    }
}
