
package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.CategoryEmission;
import com.CarbonTrack.backend.dto.FootprintAnalyticsResponse;
import com.CarbonTrack.backend.dto.FootprintPoint;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.CategoryEmissionProjection;
import com.CarbonTrack.backend.repository.DateEmissionProjection;
import com.CarbonTrack.backend.repository.UserRepository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class FootprintAnalyticsService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public FootprintAnalyticsService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(
            cacheNames = "footprintAnalytics",
            key = "#username + ':' + #period + ':' + #startDate + ':' + #endDate"
    )
    public FootprintAnalyticsResponse getAnalytics(
            String username,
            String period,
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null || endDate == null
                || endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "A valid start date and end date are required");
        }

        String normalizedPeriod =
                period == null ? "" : period.toLowerCase();

        if (!List.of("daily", "weekly", "monthly")
                .contains(normalizedPeriod)) {
            throw new IllegalArgumentException(
                    "Period must be daily, weekly, or monthly");
        }

        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Authenticated user not found"));

        Long userId = user.getId();

        List<CategoryEmission> categoryTotals =
                activityLogRepository
                        .sumEmissionsByCategoryAndDateRange(
                                userId, startDate, endDate)
                        .stream()
                        .map(this::toCategoryEmission)
                        .toList();

        List<DateEmissionProjection> dailyTotals =
                activityLogRepository
                        .sumEmissionsByDateAndDateRange(
                                userId, startDate, endDate);

        Map<LocalDate, BigDecimal> buckets = new TreeMap<>();

        for (DateEmissionProjection row : dailyTotals) {
            LocalDate date = row.getLogDate();

            LocalDate bucketStart = switch (normalizedPeriod) {
                case "weekly" -> date.with(
                        TemporalAdjusters.previousOrSame(
                                DayOfWeek.MONDAY));
                case "monthly" -> date.withDayOfMonth(1);
                default -> date;
            };

            BigDecimal emissions = row.getTotalEmissions() == null
                    ? BigDecimal.ZERO
                    : row.getTotalEmissions();

            buckets.merge(bucketStart, emissions, BigDecimal::add);
        }

        List<FootprintPoint> timeline = new ArrayList<>();

        buckets.forEach((date, total) ->
                timeline.add(new FootprintPoint(date, total)));

        BigDecimal totalEmissionsKg = categoryTotals.stream()
                .map(CategoryEmission::totalEmissionsKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new FootprintAnalyticsResponse(
                userId,
                normalizedPeriod,
                startDate,
                endDate,
                totalEmissionsKg,
                categoryTotals,
                timeline
        );
    }

    private CategoryEmission toCategoryEmission(
            CategoryEmissionProjection projection) {
        BigDecimal total = projection.getTotalEmissions() == null
                ? BigDecimal.ZERO
                : projection.getTotalEmissions();

        return new CategoryEmission(
                projection.getCategory(),
                total
        );
    }
}
