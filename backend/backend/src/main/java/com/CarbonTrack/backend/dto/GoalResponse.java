package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalResponse(
        Long id,
        BigDecimal targetReductionPct,
        Integer periodDays,
        LocalDate startDate,
        LocalDate endDate,
        String status
) {}
