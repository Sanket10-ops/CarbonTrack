package com.CarbonTrack.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateUserProfileRequest(

        @Size(max = 50, message = "Preferred transport must not exceed 50 characters")
        String preferredTransport,

        @Size(max = 50, message = "Diet preference must not exceed 50 characters")
        String dietPreference,

        @Size(max = 100, message = "Sustainability goal must not exceed 100 characters")
        String sustainabilityGoal,

        @Pattern(
                regexp = "(?i)metric|imperial",
                message = "Preferred units must be metric or imperial"
        )
        String preferredUnits,

        Boolean goalVisibility,

        Boolean leaderboardOptIn,

        Boolean organisationReportingOptIn,

        @DecimalMin(value = "0.01", message = "Monthly target must be greater than zero")
        @Digits(integer = 10, fraction = 2, message = "Monthly target supports up to 2 decimal places")
        BigDecimal monthlyTargetKg

) {
}
