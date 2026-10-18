package com.CarbonTrack.backend.dto;

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
        boolean goalVisibility
) {
}
