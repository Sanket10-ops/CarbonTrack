package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.GoalProgressResponse;
import com.CarbonTrack.backend.dto.GoalRequest;
import com.CarbonTrack.backend.dto.GoalResponse;
import com.CarbonTrack.backend.entity.ActivityLog;
import com.CarbonTrack.backend.entity.Goal;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.GoalRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class GoalService {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(4);

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;

    public GoalService(
            GoalRepository goalRepository,
            UserRepository userRepository,
            ActivityLogRepository activityLogRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional
    public GoalResponse createGoal(String username, GoalRequest request) {
        User user = requireUser(username);
        validateRequest(request);
        Goal goal = new Goal(user, request.targetReductionPct(), request.periodDays(),
                request.startDate(), "ACTIVE");
        return toResponse(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getGoals(String username) {
        User user = requireUser(username);
        return goalRepository.findAllByUserIdOrderByStartDateDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public GoalResponse getGoal(String username, Long goalId) {
        User user = requireUser(username);
        return toResponse(requireOwnedGoal(goalId, user.getId()));
    }

    @Transactional
    public GoalResponse updateGoal(String username, Long goalId, GoalRequest request) {
        User user = requireUser(username);
        validateRequest(request);
        Goal goal = requireOwnedGoal(goalId, user.getId());
        if (!"ACTIVE".equalsIgnoreCase(goal.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only active goals can be updated");
        }
        goal.setTargetReductionPct(request.targetReductionPct());
        goal.setPeriodDays(request.periodDays());
        goal.setStartDate(request.startDate());
        return toResponse(goalRepository.save(goal));
    }

    @Transactional
    public void deleteGoal(String username, Long goalId) {
        User user = requireUser(username);
        Goal goal = requireOwnedGoal(goalId, user.getId());
        goalRepository.delete(goal);
    }

    @Transactional
    public GoalProgressResponse getProgress(String username, Long goalId) {
        User user = requireUser(username);
        Goal goal = requireOwnedGoal(goalId, user.getId());
        LocalDate today = LocalDate.now();
        LocalDate start = goal.getStartDate();
        LocalDate end = start.plusDays(goal.getPeriodDays() - 1L);

        BigDecimal baseline = totalEmissions(user.getId(),
                start.minusDays(goal.getPeriodDays()), start.minusDays(1));
        LocalDate observedEnd = today.isBefore(start) ? start.minusDays(1)
                : (today.isAfter(end) ? end : today);
        BigDecimal current = observedEnd.isBefore(start) ? ZERO
                : totalEmissions(user.getId(), start, observedEnd);

        BigDecimal target = baseline.multiply(ONE_HUNDRED.subtract(goal.getTargetReductionPct()))
                .divide(ONE_HUNDRED, 4, RoundingMode.HALF_UP);
        int elapsedDays = today.isBefore(start) ? 0
                : (int) Math.min(goal.getPeriodDays(), ChronoUnit.DAYS.between(start, observedEnd) + 1);
        int daysRemaining = today.isBefore(start) ? goal.getPeriodDays()
                : (int) Math.max(0, ChronoUnit.DAYS.between(observedEnd, end));

        BigDecimal projected = null;
        BigDecimal currentReduction = null;
        Boolean onTrack = null;
        List<String> alerts = new ArrayList<>();
        boolean baselineAvailable = baseline.compareTo(BigDecimal.ZERO) > 0;

        if (today.isBefore(start)) {
            alerts.add("NOT_STARTED: This goal has not started yet.");
            if (!baselineAvailable) {
                alerts.add("BASELINE_UNAVAILABLE: No emissions were recorded during the baseline period; progress will be measurable once a valid baseline exists.");
            }
        } else if (baselineAvailable && elapsedDays > 0) {
            BigDecimal baselineToDate = baseline.multiply(BigDecimal.valueOf(elapsedDays))
                    .divide(BigDecimal.valueOf(goal.getPeriodDays()), 4, RoundingMode.HALF_UP);
            currentReduction = baselineToDate.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO.setScale(2)
                    : baselineToDate.subtract(current).multiply(ONE_HUNDRED)
                    .divide(baselineToDate, 2, RoundingMode.HALF_UP);
            projected = current.multiply(BigDecimal.valueOf(goal.getPeriodDays()))
                    .divide(BigDecimal.valueOf(elapsedDays), 4, RoundingMode.HALF_UP);
            onTrack = projected.compareTo(target) <= 0;
            if (onTrack) {
                alerts.add("ON_TRACK: Your recent footprint trend is within your goal budget.");
            } else {
                alerts.add("ACTION_NEEDED: Your recent footprint trend is above the target trajectory.");
            }
        } else if (!baselineAvailable) {
            alerts.add("BASELINE_UNAVAILABLE: No emissions were recorded during the baseline period; log activities in that period to calculate a meaningful reduction.");
        }

        String status = goal.getStatus();
        if (today.isAfter(end) && "ACTIVE".equalsIgnoreCase(status)) {
            if (baselineAvailable && current.compareTo(target) <= 0) {
                status = "ACHIEVED";
                alerts.add("GOAL_ACHIEVED: You met your footprint-reduction target.");
            } else {
                status = "MISSED";
                alerts.add("GOAL_MISSED: The goal period ended without meeting the target.");
            }
            goal.setStatus(status);
            goalRepository.save(goal);
        } else if ("ACHIEVED".equalsIgnoreCase(status)) {
            alerts.add("GOAL_ACHIEVED: This goal was completed successfully.");
        } else if ("MISSED".equalsIgnoreCase(status)) {
            alerts.add("GOAL_MISSED: This goal ended without meeting its target.");
        }

        return new GoalProgressResponse(goal.getId(), status,
                goal.getTargetReductionPct(), goal.getPeriodDays(), start, end,
                scale(baseline), scale(target), scale(current),
                projected == null ? null : scale(projected), currentReduction,
                elapsedDays, daysRemaining, onTrack, List.copyOf(alerts));
    }

    private BigDecimal totalEmissions(Long userId, LocalDate start, LocalDate end) {
        if (end.isBefore(start)) return ZERO;
        return activityLogRepository
                .findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, start, end)
                .stream()
                .map(ActivityLog::getCo2eKg)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Authenticated user was not found"));
    }

    private Goal requireOwnedGoal(Long goalId, Long userId) {
        if (goalId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal was not found");
        }
        return goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Goal was not found"));
    }

    private void validateRequest(GoalRequest request) {
        if (request == null || request.targetReductionPct() == null
                || request.periodDays() == null || request.startDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "targetReductionPct, periodDays and startDate are required");
        }
        if (request.targetReductionPct().compareTo(new BigDecimal("0.01")) < 0
                || request.targetReductionPct().compareTo(ONE_HUNDRED) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "targetReductionPct must be greater than 0 and no greater than 100");
        }
        if (request.periodDays() < 7 || request.periodDays() > 365) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "periodDays must be between 7 and 365");
        }
    }

    private GoalResponse toResponse(Goal goal) {
        return new GoalResponse(goal.getId(), goal.getTargetReductionPct(),
                goal.getPeriodDays(), goal.getStartDate(),
                goal.getStartDate().plusDays(goal.getPeriodDays() - 1L), goal.getStatus());
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(4, RoundingMode.HALF_UP);
    }
}
