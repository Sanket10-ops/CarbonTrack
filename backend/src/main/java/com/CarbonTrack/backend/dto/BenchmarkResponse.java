package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;

public record BenchmarkResponse(BigDecimal yourEmissionsKg,
                                BigDecimal communityAverageKg,
                                Long participantCount,
                                String comparison) {}