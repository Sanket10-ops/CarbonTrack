
package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;

public record CategoryEmission(
        String category,
        BigDecimal totalEmissionsKg
) {}
