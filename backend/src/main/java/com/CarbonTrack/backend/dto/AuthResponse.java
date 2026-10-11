package com.CarbonTrack.backend.dto;

public record AuthResponse(
        Long id,
        String username,
        String email,
        String role
) {
}