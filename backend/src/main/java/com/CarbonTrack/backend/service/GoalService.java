package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.CreateGoalRequest;
import com.CarbonTrack.backend.dto.GoalProgressResponse;
import com.CarbonTrack.backend.entity.Goal;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.GoalRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class GoalService {

    private final GoalRepository goals;
    private final UserRepository users;
    private final ActivityLogRepository activities;

    public GoalService(
            GoalRepository goals,
            UserRepository users,
            ActivityLogRepository activities) {
        this.goals = goals;
        this.users = users;
        this.activities = activities;
    }

    @Transactional
    public Goal create(String username, CreateGoalRequest request) {
        if (request == null
                || request.targetReductionPct() == null
                || request.periodDays() == null) {
            throw new IllegalArgumentException(
                    "Target reduction and period are required");
        }

        LocalDate startDate = request.startDate() == null
                ? LocalDate.now()
                : request.startDate();

        if (startDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Goal start date cannot be in the future");
        }

        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return goals.save(new Goal(
                user,
                request.targetReductionPct(),
                request.periodDays(),
                startDate,
                "ACTIVE"
        ));
    }

    @Transactional(readOnly = true)
    public List<Goal> list(String username) {
        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return goals.findByUserIdOrderByStartDateDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public GoalProgressResponse progress(String username, Long goalId) {
        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Goal goal = goals.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));

        LocalDate start = goal.getStartDate();
        LocalDate end = start.plusDays(goal.getPeriodDays() - 1L);
        LocalDate today = LocalDate.now();

        // Compare equal-length windows while a goal is in progress.
        // Once the goal period is complete, both windows cover periodDays.
        LocalDate currentEnd = today.isAfter(end) ? end : today;
        long elapsedDays = ChronoUnit.DAYS.between(start, currentEnd) + 1L;

        if (elapsedDays < 1L) {
            elapsedDays = 1L;
            currentEnd = start;
        }

        LocalDate baselineEnd = start.minusDays(1L);
        LocalDate baselineStart = baselineEnd.minusDays(elapsedDays - 1L);

        BigDecimal baseline = sum(user.getId(), baselineStart, baselineEnd);
        BigDecimal current = sum(user.getId(), start, currentEnd);

        BigDecimal reductionPct = baseline.signum() == 0
                ? BigDecimal.ZERO
                : baseline.subtract(current)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(baseline, 2, RoundingMode.HALF_UP);

        boolean periodComplete = today.isAfter(end);
        String status;

        if (periodComplete) {
            status = reductionPct.compareTo(goal.getTargetReductionPct()) >= 0
                    ? "ACHIEVED"
                    : "MISSED";
        } else {
            status = reductionPct.compareTo(goal.getTargetReductionPct()) >= 0
                    ? "ACHIEVED"
                    : "IN_PROGRESS";
        }

        return new GoalProgressResponse(
                goal.getId(),
                goal.getTargetReductionPct(),
                goal.getPeriodDays(),
                start,
                end,
                baseline,
                current,
                reductionPct,
                status
        );
    }

    private BigDecimal sum(Long userId, LocalDate start, LocalDate end) {
        if (end.isBefore(start)) {
            return BigDecimal.ZERO;
        }

        return activities
                .findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, start, end)
                .stream()
                .map(activity -> activity.getCo2eKg() == null
                        ? BigDecimal.ZERO
                        : activity.getCo2eKg())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
