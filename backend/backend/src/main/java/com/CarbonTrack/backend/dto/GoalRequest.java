package com.CarbonTrack.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Request used to create or update a user's footprint-reduction goal. */
public record GoalRequest(
        @NotNull(message = "targetReductionPct is required")
        @DecimalMin(value = "0.01", message = "targetReductionPct must be greater than 0")
        @DecimalMax(value = "100.00", message = "targetReductionPct cannot exceed 100")
        BigDecimal targetReductionPct,

        @NotNull(message = "periodDays is required")
        @Min(value = 7, message = "periodDays must be at least 7")
        @Max(value = 365, message = "periodDays cannot exceed 365")
        Integer periodDays,

        @NotNull(message = "startDate is required; use yyyy-MM-dd")
        LocalDate startDate
) {}
