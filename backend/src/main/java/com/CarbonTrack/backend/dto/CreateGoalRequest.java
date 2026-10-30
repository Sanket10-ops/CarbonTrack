package com.CarbonTrack.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateGoalRequest(
        @DecimalMin("1.0") @DecimalMax("100.0") BigDecimal targetReductionPct,
        @Min(7) @Max(365) Integer periodDays,
        LocalDate startDate) {}