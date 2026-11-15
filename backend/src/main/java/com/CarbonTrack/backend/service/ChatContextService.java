package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.entity.ActivityLog;
import com.CarbonTrack.backend.entity.Goal;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ChatContextService {

    private static final int LOOKBACK_DAYS = 30;

    private final ActivityLogRepository activities;
    private final UserRepository users;
    private final GoalService goals;
    private final RecommendationService recommendations;

    public ChatContextService(
            ActivityLogRepository activities,
            UserRepository users,
            GoalService goals,
            RecommendationService recommendations) {
        this.activities = activities;
        this.users = users;
        this.goals = goals;
        this.recommendations = recommendations;
    }

    /**
     * Builds a compact account-scoped summary. No names, emails, account IDs or
     * raw activity rows are sent to the model provider.
     */
    @Transactional(readOnly = true)
    public String buildContext(String username) {
        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(LOOKBACK_DAYS - 1L);
        List<ActivityLog> recent = activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                user.getId(), from, to);

        Map<String, BigDecimal> categoryTotals = new LinkedHashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        Set<LocalDate> activeDates = new HashSet<>();

        for (ActivityLog activity : recent) {
            BigDecimal emissions = activity.getCo2eKg() == null
                    ? BigDecimal.ZERO : activity.getCo2eKg();
            total = total.add(emissions);
            String category = activity.getCategory() == null
                    ? "other" : activity.getCategory().toLowerCase(Locale.ROOT);
            categoryTotals.merge(category, emissions, BigDecimal::add);
            if (activity.getLogDate() != null) activeDates.add(activity.getLogDate());
        }

        BigDecimal recordedTotal = total;
        BigDecimal denominator = recordedTotal.max(new BigDecimal("0.0001"));
        StringBuilder context = new StringBuilder(1800);
        context.append("CarbonTrack aggregated account summary, ")
                .append(from).append(" to ").append(to).append(".\n")
                .append("Recorded activities: ").append(recent.size())
                .append("; active tracking days: ").append(activeDates.size())
                .append("; recorded emissions: ").append(format(recordedTotal))
                .append(" kg CO2e.\n");

        if (recent.isEmpty()) {
            context.append("No activities were recorded in this period. Do not invent footprint values.\n");
        } else {
            context.append("Category totals (kg CO2e):\n");
            categoryTotals.entrySet().stream()
                    .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                    .forEach(entry -> {
                        BigDecimal share = entry.getValue().multiply(BigDecimal.valueOf(100))
                                .divide(denominator, 1, RoundingMode.HALF_UP);
                        context.append("- ").append(entry.getKey()).append(": ")
                                .append(format(entry.getValue())).append(" kg (")
                                .append(share.toPlainString()).append("%)\n");
                    });
        }

        if (user.getMonthlyTargetKg() != null && user.getMonthlyTargetKg().signum() > 0) {
            context.append("Monthly emissions budget: ")
                    .append(format(user.getMonthlyTargetKg())).append(" kg CO2e.\n");
        } else {
            context.append("No monthly emissions budget is configured.\n");
        }

        List<Goal> activeGoals = goals.list(username).stream()
                .filter(goal -> "ACTIVE".equalsIgnoreCase(goal.getStatus()))
                .toList();
        if (!activeGoals.isEmpty()) {
            Goal goal = activeGoals.get(0);
            var progress = goals.progress(username, goal.getId());
            context.append("Active reduction goal: ")
                    .append(format(goal.getTargetReductionPct())).append("% over ")
                    .append(goal.getPeriodDays()).append(" days; status ")
                    .append(progress.status()).append("; measured reduction ")
                    .append(format(progress.reductionPct())).append("%; baseline ")
                    .append(format(progress.baselineEmissionsKg())).append(" kg CO2e; current ")
                    .append(format(progress.currentEmissionsKg())).append(" kg CO2e.\n");
        } else {
            context.append("No active reduction goal is configured.\n");
        }

        var nextSteps = recommendations.recommendations(username);
        if (!nextSteps.isEmpty()) {
            context.append("Existing recommendations:\n");
            nextSteps.stream().limit(3).forEach(item -> context.append("- ")
                    .append(item.category()).append(": ")
                    .append(item.title()).append(" — ")
                    .append(item.action()).append("\n"));
        }
        return context.toString();
    }

    private String format(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value)
                .setScale(2, RoundingMode.HALF_UP)
                .toPlainString();
    }
}
