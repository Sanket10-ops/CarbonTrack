
package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FootprintAnalyticsResponse(
        Long userId,
        String period,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalEmissionsKg,
        List<CategoryEmission> categoryTotals,
        List<FootprintPoint> timeline
) {}
