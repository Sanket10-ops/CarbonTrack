
package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.FootprintAnalyticsResponse;
import com.CarbonTrack.backend.service.FootprintAnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics/footprint")
public class FootprintAnalyticsController {

    private final FootprintAnalyticsService footprintAnalyticsService;

    public FootprintAnalyticsController(
            FootprintAnalyticsService footprintAnalyticsService) {
        this.footprintAnalyticsService = footprintAnalyticsService;
    }

    @GetMapping
    public FootprintAnalyticsResponse getFootprintAnalytics(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return footprintAnalyticsService.getAnalytics(
                jwt.getSubject(),
                period,
                startDate,
                endDate
        );
    }
}
