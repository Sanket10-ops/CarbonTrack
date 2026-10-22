
package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FootprintPoint(
        LocalDate periodStart,
        BigDecimal totalEmissionsKg
) {}
