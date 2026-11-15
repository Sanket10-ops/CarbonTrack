package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id,
        String username,
        String email,
        String role,
        LocalDateTime createdAt,
        String preferredTransport,
        String dietPreference,
        String sustainabilityGoal,
        String preferredUnits,
        boolean goalVisibility,
        boolean leaderboardOptIn,
        boolean organisationReportingOptIn,
        BigDecimal monthlyTargetKg,
        Long organisationId,
        String organisationName
) {
}
