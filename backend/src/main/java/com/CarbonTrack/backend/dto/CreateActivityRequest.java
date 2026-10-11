
package com.CarbonTrack.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateActivityRequest(

        @NotBlank(message = "Category is required")
        @Pattern(
                regexp = "transport|electricity|food|shopping",
                flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Category must be transport, electricity, food, or shopping"
        )
        String category,

        @NotBlank(message = "Activity type is required")
        @Size(max = 100, message = "Activity type must not exceed 100 characters")
        String activityType,

        @NotNull(message = "Quantity is required")
        @DecimalMin(
                value = "0.0",
                inclusive = true,
                message = "Quantity cannot be negative"
        )
        @DecimalMax(
                value = "99999999.9999",
                message = "Quantity exceeds the maximum allowed value"
        )
        BigDecimal quantity,

        @NotBlank(message = "Unit is required")
        @Size(max = 50, message = "Unit must not exceed 50 characters")
        String unit,

        @NotNull(message = "Activity date is required")
        @PastOrPresent(message = "Activity date cannot be in the future")
        LocalDate logDate
) {
}
