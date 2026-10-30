package com.CarbonTrack.backend.repository;

import java.math.BigDecimal;

public interface ActivityBenchmarkProjection {
    BigDecimal getAverageEmissions();
    Long getParticipantCount();
}