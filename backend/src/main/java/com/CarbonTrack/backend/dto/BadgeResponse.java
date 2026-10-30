package com.CarbonTrack.backend.dto;

import java.time.LocalDateTime;

public record BadgeResponse(Long id, String name, String description,
                            String triggerType, LocalDateTime awardedAt) {}