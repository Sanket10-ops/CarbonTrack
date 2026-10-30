package com.CarbonTrack.backend.dto;

public record RecommendationResponse(String category, String title,
                                     String action, String reason) {}