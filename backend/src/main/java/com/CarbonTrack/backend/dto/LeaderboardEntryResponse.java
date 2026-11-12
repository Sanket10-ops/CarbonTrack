package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record LeaderboardEntryResponse(
        int rank,
        String displayAlias,
        BigDecimal totalCo2eKg,
        String strongestCategory,
        List<String> badges,
        String habitTip
) {}
