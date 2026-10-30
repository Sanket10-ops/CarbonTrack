package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalProgressResponse(
        Long goalId, BigDecimal targetReductionPct, Integer periodDays,
        LocalDate startDate, LocalDate endDate, BigDecimal baselineEmissionsKg,
        BigDecimal currentEmissionsKg, BigDecimal reductionPct, String status) {}