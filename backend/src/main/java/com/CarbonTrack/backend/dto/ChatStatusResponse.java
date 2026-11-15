package com.CarbonTrack.backend.dto;

public record ChatStatusResponse(
        boolean configured,
        String provider,
        String model) {
}
