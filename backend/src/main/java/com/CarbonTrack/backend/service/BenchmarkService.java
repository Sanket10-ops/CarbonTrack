package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.BenchmarkResponse;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class BenchmarkService {

    private final UserRepository users;
    private final ActivityLogRepository activities;

    public BenchmarkService(
            UserRepository users,
            ActivityLogRepository activities) {
        this.users = users;
        this.activities = activities;
    }

    @Transactional(readOnly = true)
    public BenchmarkResponse benchmark(
            String username,
            LocalDate start,
            LocalDate end) {

        if (start == null || end == null || end.isBefore(start)) {
            throw new IllegalArgumentException("Valid date range required");
        }

        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BigDecimal personalTotal = activities
                .findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                        user.getId(), start, end)
                .stream()
                .map(activity -> activity.getCo2eKg() == null
                        ? BigDecimal.ZERO
                        : activity.getCo2eKg())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // One aggregate query includes opted-in users with zero activity;
        // the denominator is the number of users who explicitly opted in.
        long participantCount = users.countByGoalVisibilityTrue();
        BigDecimal communityTotal = activities
                .sumOptedInUserEmissionsByDateRange(start, end);

        BigDecimal average = participantCount == 0
                ? BigDecimal.ZERO
                : communityTotal.divide(
                        BigDecimal.valueOf(participantCount),
                        2,
                        RoundingMode.HALF_UP);

        String comparison;
        if (participantCount == 0) {
            comparison = "NO_COMPARISON";
        } else {
            int result = personalTotal.compareTo(average);
            comparison = result > 0
                    ? "ABOVE_AVERAGE"
                    : result < 0
                            ? "BELOW_AVERAGE"
                            : "AT_AVERAGE";
        }

        return new BenchmarkResponse(
                personalTotal,
                average,
                participantCount,
                comparison);
    }
}
