package com.CarbonTrack.backend.repository;

import java.math.BigDecimal;

public interface LeaderboardActivityProjection {
    Long getUserId();
    String getCategory();
    String getActivityType();
    BigDecimal getTotalEmissionsKg();
}
