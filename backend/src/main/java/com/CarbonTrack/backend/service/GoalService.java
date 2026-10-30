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
import java.util.List;

@Service
public class GoalService {
    private final GoalRepository goals;
    private final UserRepository users;
    private final ActivityLogRepository activities;

    public GoalService(GoalRepository goals, UserRepository users, ActivityLogRepository activities) {
        this.goals = goals; this.users = users; this.activities = activities;
    }

    @Transactional
    public Goal create(String username, CreateGoalRequest request) {
        if (request.targetReductionPct() == null || request.periodDays() == null)
            throw new IllegalArgumentException("Target reduction and period are required");
        var user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return goals.save(new Goal(user, request.targetReductionPct(), request.periodDays(),
                request.startDate() == null ? LocalDate.now() : request.startDate(), "ACTIVE"));
    }

    @Transactional(readOnly = true)
    public List<Goal> list(String username) {
        var user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return goals.findByUserIdOrderByStartDateDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public GoalProgressResponse progress(String username, Long goalId) {
        var user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Goal goal = goals.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        LocalDate start = goal.getStartDate();
        LocalDate end = start.plusDays(goal.getPeriodDays() - 1L);
        LocalDate baselineStart = start.minusDays(goal.getPeriodDays());
        BigDecimal baseline = sum(user.getId(), baselineStart, start.minusDays(1));
        BigDecimal current = sum(user.getId(), start, end.isAfter(LocalDate.now()) ? LocalDate.now() : end);
        BigDecimal reduction = baseline.signum() == 0 ? BigDecimal.ZERO :
                baseline.subtract(current).multiply(BigDecimal.valueOf(100))
                        .divide(baseline, 2, RoundingMode.HALF_UP);
        String status = LocalDate.now().isAfter(end) ?
                (reduction.compareTo(goal.getTargetReductionPct()) >= 0 ? "ACHIEVED" : "MISSED") :
                (reduction.compareTo(goal.getTargetReductionPct()) >= 0 ? "ACHIEVED" : "IN_PROGRESS");
        return new GoalProgressResponse(goal.getId(), goal.getTargetReductionPct(), goal.getPeriodDays(),
                start, end, baseline, current, reduction, status);
    }

    private BigDecimal sum(Long userId, LocalDate start, LocalDate end) {
        if (end.isBefore(start)) return BigDecimal.ZERO;
        return activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, start, end)
                .stream().map(a -> a.getCo2eKg() == null ? BigDecimal.ZERO : a.getCo2eKg())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}