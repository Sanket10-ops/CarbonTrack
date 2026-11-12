package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.ChatResponse;
import com.CarbonTrack.backend.dto.GoalProgressResponse;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ChatService {

    private static final int LOOKBACK_DAYS = 30;

    private final ActivityLogRepository activities;
    private final UserRepository users;
    private final GoalService goals;
    private final RecommendationService recommendations;

    public ChatService(
            ActivityLogRepository activities,
            UserRepository users,
            GoalService goals,
            RecommendationService recommendations) {
        this.activities = activities;
        this.users = users;
        this.goals = goals;
        this.recommendations = recommendations;
    }

    @Transactional(readOnly = true)
    public ChatResponse reply(String username, String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Please enter a message");
        }

        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(LOOKBACK_DAYS - 1L);
        List<ActivityLog> recent = activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                user.getId(), from, to);

        Map<String, BigDecimal> categoryTotals = new LinkedHashMap<>();
        BigDecimal total = BigDecimal.ZERO;

        for (ActivityLog activity : recent) {
            BigDecimal emissions = activity.getCo2eKg() == null
                    ? BigDecimal.ZERO : activity.getCo2eKg();
            total = total.add(emissions);
            String category = activity.getCategory() == null
                    ? "other" : activity.getCategory().toLowerCase(Locale.ROOT);
            categoryTotals.merge(category, emissions, BigDecimal::add);
        }

        String question = message.trim().toLowerCase(Locale.ROOT);

        if (isGreeting(question)) {
            return response(
                    "Hello! I’m your CarbonTrack sustainability guide. I can summarize your recent footprint, explain your largest category, review your goals, and suggest practical ways to reduce emissions.",
                    "Summarise my carbon footprint",
                    "How are my goals progressing?",
                    "Give me personalised reduction tips");
        }

        if (containsAny(question, "help", "what can you do", "how do i use")) {
            return response(
                    "Ask me about your last 30 days of recorded emissions, a specific category (transport, electricity, food or shopping), your active reduction goal, or practical reduction ideas. I use your CarbonTrack records and built-in guidance; I do not generate answers using an external AI model.",
                    "Show my footprint summary",
                    "Which category is highest?",
                    "Show my goal progress");
        }

        if (containsAny(question, "goal", "target", "progress", "on track", "on-track")) {
            return goalReply(username);
        }

        if (containsAny(question, "badge", "achievement", "streak")) {
            return response(
                    "You have " + recent.size() + " activity entr" + (recent.size() == 1 ? "y" : "ies")
                            + " recorded in the last 30 days, representing " + format(total)
                            + " kg CO₂e. Your Achievements page shows badges already awarded to your account. Keep logging consistently to work toward the next milestone.",
                    "Show my footprint summary",
                    "Give me a small action for today",
                    "How can I reduce transport emissions?");
        }

        String category = requestedCategory(question);
        if (category != null) {
            return categoryReply(category, categoryTotals, total, recent.size());
        }

        if (containsAny(question, "tip", "recommend", "reduce", "lower", "improve", "save", "suggest", "what should i do")) {
            return recommendationReply(username, total, categoryTotals);
        }

        if (containsAny(question, "footprint", "emission", "co2", "carbon", "impact",
                "summary", "total", "how much", "activity", "tracked")) {
            return summaryReply(recent, total, categoryTotals);
        }

        return response(
                "I can help with CarbonTrack data and practical sustainability guidance. Try asking for your footprint summary, your highest-emission category, goal progress, or reduction tips. I can only report data stored in your signed-in CarbonTrack account.",
                "Summarise my carbon footprint",
                "Which category is highest?",
                "Give me personalised reduction tips");
    }

    private ChatResponse summaryReply(
            List<ActivityLog> recent,
            BigDecimal total,
            Map<String, BigDecimal> categoryTotals) {
        if (recent.isEmpty()) {
            return response(
                    "There are no activities recorded in your account for the last 30 days, so I do not have enough data to calculate a recent footprint yet. Log activities in transport, electricity, food or shopping and ask me again.",
                    "Open the activity log",
                    "How is CO₂e calculated?",
                    "Give me general reduction tips");
        }

        long activeDays = recent.stream()
                .map(ActivityLog::getLogDate)
                .filter(date -> date != null)
                .distinct()
                .count();
        Map.Entry<String, BigDecimal> largest = largestCategory(categoryTotals);

        String leading = largest == null
                ? "No category total is available"
                : label(largest.getKey()) + " is your largest category at "
                        + format(largest.getValue()) + " kg CO₂e";

        return response(
                "In the last 30 days (" + LocalDate.now().minusDays(LOOKBACK_DAYS - 1L)
                        + " to " + LocalDate.now() + "), you recorded " + recent.size()
                        + " activities across " + activeDays + " active days, totalling "
                        + format(total) + " kg CO₂e. " + leading + ". These figures use your recorded activities only; unlogged activities are not included.",
                "Break down my transport emissions",
                "Show my goal progress",
                "How can I reduce my largest category?");
    }

    private ChatResponse categoryReply(
            String category,
            Map<String, BigDecimal> categoryTotals,
            BigDecimal total,
            int activityCount) {
        BigDecimal amount = categoryTotals.getOrDefault(category, BigDecimal.ZERO);
        String guidance = switch (category) {
            case "transport" -> "For suitable short journeys, try walking, cycling, public transport or sharing a ride. Replacing one regular car trip is a manageable starting point.";
            case "electricity" -> "Start with high-use appliances: switch off idle devices, use efficient settings and avoid unnecessary cooling or heating.";
            case "food" -> "Try replacing a few higher-impact meals with plant-based options that fit your diet and preferences.";
            case "shopping" -> "Before buying, consider whether you can repair, reuse, borrow or choose a durable second-hand option.";
            default -> "Keep recording this category so its contribution can be measured more accurately.";
        };

        return response(
                "Your " + label(category).toLowerCase(Locale.ROOT)
                        + " activities account for " + format(amount) + " kg CO₂e in the last 30 days. "
                        + "Your recorded footprint across all categories is " + format(total)
                        + " kg CO₂e from " + activityCount + " activities. " + guidance,
                "Summarise my carbon footprint",
                "Show my goal progress",
                "Give me another practical action");
    }

    private ChatResponse recommendationReply(
            String username,
            BigDecimal total,
            Map<String, BigDecimal> categoryTotals) {
        var suggestions = recommendations.recommendations(username);
        if (suggestions.isEmpty()) {
            return response(
                    "I need some recent activity records before I can personalise reduction ideas. Log a few activities first. In the meantime, you can start with lower-carbon travel for suitable short trips, efficient electricity use, lower-impact meals and buying only what you need.",
                    "Open the activity log",
                    "How is CO₂e calculated?",
                    "Show my footprint summary");
        }

        StringBuilder reply = new StringBuilder();
        reply.append("Based on your last 30 days (")
                .append(format(total)).append(" kg CO₂e), here are practical places to start:");
        int position = 1;
        for (var item : suggestions) {
            BigDecimal categoryTotal = categoryTotals.getOrDefault(item.category(), BigDecimal.ZERO);
            reply.append("\n\n").append(position++).append(". ")
                    .append(item.title()).append(" — ")
                    .append(item.action()).append(" (")
                    .append(format(categoryTotal)).append(" kg CO₂e recorded in ")
                    .append(item.category()).append(").");
        }
        reply.append("\n\nThese are suggestions, not guaranteed emission savings. Continue logging activities to see whether your totals change.");

        return response(reply.toString(),
                "Show my footprint summary",
                "Which category is highest?",
                "Show my goal progress");
    }

    private ChatResponse goalReply(String username) {
        List<Goal> userGoals = goals.list(username);
        Goal selected = userGoals.stream()
                .filter(goal -> "ACTIVE".equalsIgnoreCase(goal.getStatus()))
                .findFirst()
                .orElse(userGoals.isEmpty() ? null : userGoals.get(0));

        if (selected == null) {
            return response(
                    "You do not have a reduction goal yet. Create one from the My Goals page by choosing a target reduction percentage and duration. Once you have a goal, I can explain its current progress.",
                    "Help me choose a realistic goal",
                    "Show my footprint summary",
                    "Give me reduction tips");
        }

        GoalProgressResponse progress = goals.progress(username, selected.getId());
        return response(
                "Your current goal is a " + format(selected.getTargetReductionPct())
                        + "% reduction over " + selected.getPeriodDays() + " days, starting "
                        + selected.getStartDate() + ". Current status: "
                        + progress.status().replace('_', ' ').toLowerCase(Locale.ROOT)
                        + ". The measured baseline is " + format(progress.baselineEmissionsKg())
                        + " kg CO₂e and the current-period total is "
                        + format(progress.currentEmissionsKg()) + " kg CO₂e, giving a calculated reduction of "
                        + format(progress.reductionPct()) + "%. "
                        + (progress.baselineEmissionsKg().signum() == 0
                        ? "A reduction percentage cannot be meaningfully assessed until the baseline period contains recorded emissions."
                        : "Keep logging activities so this comparison reflects your actual behaviour."),
                "Show my footprint summary",
                "Give me practical ways to reduce emissions",
                "Which category is highest?");
    }

    private ChatResponse response(String reply, String... suggestions) {
        return new ChatResponse(reply, List.of(suggestions), "Last 30 days");
    }

    private Map.Entry<String, BigDecimal> largestCategory(Map<String, BigDecimal> totals) {
        return totals.entrySet().stream()
                .max(Map.Entry.<String, BigDecimal>comparingByValue()
                        .thenComparing(Map.Entry::getKey))
                .orElse(null);
    }

    private String requestedCategory(String question) {
        if (containsAny(question, "transport", "travel", "commute", "flight")
                || containsWholeWord(question, "car")) return "transport";
        if (containsAny(question, "electricity", "energy", "power", "kwh")) return "electricity";
        if (containsAny(question, "food", "meal", "diet", "beef", "chicken")) return "food";
        if (containsAny(question, "shopping", "purchase", "clothing", "electronics")) return "shopping";
        return null;
    }

    private boolean isGreeting(String question) {
        return question.matches("^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$");
    }

    private boolean containsWholeWord(String value, String term) {
        return java.util.regex.Pattern.compile("\\b" + java.util.regex.Pattern.quote(term) + "\\b")
                .matcher(value)
                .find();
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) return true;
        }
        return false;
    }

    private String label(String category) {
        return switch (category) {
            case "transport" -> "Transport";
            case "electricity" -> "Electricity";
            case "food" -> "Food";
            case "shopping" -> "Shopping";
            default -> "Other";
        };
    }

    private String format(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value)
                .setScale(2, RoundingMode.HALF_UP)
                .toPlainString();
    }
}
