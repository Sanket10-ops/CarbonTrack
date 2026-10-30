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

        @NotBlank(message = "Category is required.")
        @Pattern(
                regexp = "transport|electricity|food|shopping",
                flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Invalid category. Allowed categories: transport, electricity, food, shopping."
        )
        String category,

        @NotBlank(message = "Activity type is required.")
        @Size(max = 100, message = "Activity type must not exceed 100 characters.")
        String activityType,

        @NotNull(message = "Quantity is required.")
        @DecimalMin(
                value = "0.0",
                inclusive = true,
                message = "Quantity must be greater than or equal to 0."
        )
        @DecimalMax(
                value = "99999999.9999",
                message = "Quantity exceeds the maximum allowed value."
        )
        BigDecimal quantity,

        @NotBlank(message = "Unit is required.")
        @Size(max = 50, message = "Unit must not exceed 50 characters.")
        String unit,

        @NotNull(message = "Activity date is required.")
        @PastOrPresent(message = "Activity date cannot be in the future.")
        LocalDate logDate,

        @Size(max = 50, message = "Energy source must not exceed 50 characters.")
        String energySource,

        @Size(max = 50, message = "Meal type must not exceed 50 characters.")
        String mealType,

        @DecimalMin(
                value = "0.0",
                inclusive = false,
                message = "Servings must be greater than zero."
        )
        @DecimalMax(
                value = "99999999.99",
                message = "Servings exceeds the maximum allowed value."
        )
        BigDecimal servings,

        @Size(max = 100, message = "Product category must not exceed 100 characters.")
        String productCategory,

        @DecimalMin(
                value = "0.0",
                inclusive = true,
                message = "Spend amount cannot be negative."
        )
        @DecimalMax(
                value = "9999999999.99",
                message = "Spend amount exceeds the maximum allowed value."
        )
        BigDecimal spendAmount,

        @Pattern(
                regexp = "[A-Za-z]{3}",
                message = "Spend currency must be a three-letter currency code."
        )
        String spendCurrency,

        @DecimalMin(
                value = "0.0",
                inclusive = true,
                message = "Flight distance cannot be negative."
        )
        @DecimalMax(
                value = "9999999999.99",
                message = "Flight distance exceeds the maximum allowed value."
        )
        BigDecimal flightDistanceKm

) {
}
