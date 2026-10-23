package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Goal state and projection. All footprint values are expressed in kg CO2e. */
public record GoalProgressResponse(
        Long goalId,
        String status,
        BigDecimal targetReductionPct,
        Integer periodDays,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal baselineFootprintKg,
        BigDecimal targetFootprintKg,
        BigDecimal currentFootprintKg,
        BigDecimal projectedFootprintKg,
        BigDecimal currentReductionPct,
        Integer elapsedDays,
        Integer daysRemaining,
        Boolean onTrack,
        List<String> alerts
) {}
