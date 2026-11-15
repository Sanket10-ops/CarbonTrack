package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.LeaderboardEntryResponse;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.LeaderboardActivityProjection;
import com.CarbonTrack.backend.repository.UserBadgeNameProjection;
import com.CarbonTrack.backend.repository.UserBadgeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class LeaderboardService {

    private final ActivityLogRepository activities;
    private final UserBadgeRepository badges;
    private final String salt;

    public LeaderboardService(
            ActivityLogRepository activities,
            UserBadgeRepository badges,
            @Value("${carbontrack.leaderboard.salt}") String salt) {
        this.activities = activities;
        this.badges = badges;
        this.salt = salt;
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> getLeaderboard(
            LocalDate from, LocalDate to, int limit) {
        validateRange(from, to);

        int safeLimit = Math.max(1, Math.min(limit, 50));
        List<LeaderboardActivityProjection> totals =
                activities.aggregateOptedInLeaderboard(from, to);

        Map<Long, RankedBuilder> byUser = new LinkedHashMap<>();
        for (LeaderboardActivityProjection row : totals) {
            if (row.getUserId() == null) continue;
            BigDecimal amount = row.getTotalEmissionsKg() == null
                    ? BigDecimal.ZERO : row.getTotalEmissionsKg();
            RankedBuilder builder = byUser.computeIfAbsent(
                    row.getUserId(), ignored -> new RankedBuilder());
            builder.total = builder.total.add(amount);
            String category = row.getCategory() == null
                    ? "other" : row.getCategory().toLowerCase(Locale.ROOT);
            builder.categoryTotals.merge(category, amount, BigDecimal::add);
            String activityType = row.getActivityType() == null
                    ? category : row.getActivityType().toLowerCase(Locale.ROOT);
            builder.activityTypeTotals.merge(activityType, amount, BigDecimal::add);
        }

        if (byUser.isEmpty()) return List.of();

        List<Long> userIds = new ArrayList<>(byUser.keySet());
        userIds.sort(Long::compareTo);
        Map<Long, List<String>> badgeNames = new HashMap<>();
        List<UserBadgeNameProjection> badgeRows = badges.findBadgeNamesForUsers(userIds);
        for (UserBadgeNameProjection badge : badgeRows) {
            badgeNames.computeIfAbsent(badge.getUserId(), ignored -> new ArrayList<>())
                    .add(badge.getBadgeName());
        }

        List<Ranked> ranked = new ArrayList<>();
        byUser.forEach((userId, builder) -> {
            String strongestCategory = builder.categoryTotals.entrySet().stream()
                    .max(Map.Entry.<String, BigDecimal>comparingByValue()
                            .thenComparing(Map.Entry::getKey))
                    .map(Map.Entry::getKey)
                    .orElse("not_recorded");
            ranked.add(new Ranked(
                    builder.total,
                    alias(userId),
                    strongestCategory,
                    builder.activityTypeTotals.entrySet().stream()
                            .max(Map.Entry.<String, BigDecimal>comparingByValue()
                                    .thenComparing(Map.Entry::getKey))
                            .map(Map.Entry::getKey).orElse(strongestCategory),
                    List.copyOf(badgeNames.getOrDefault(userId, List.of()))));
        });

        ranked.sort(Comparator.comparing(Ranked::total)
                .thenComparing(Ranked::alias));

        List<LeaderboardEntryResponse> result = new ArrayList<>();
        for (int i = 0; i < Math.min(safeLimit, ranked.size()); i++) {
            Ranked item = ranked.get(i);
            result.add(new LeaderboardEntryResponse(
                    i + 1,
                    item.alias(),
                    item.total(),
                    item.strongestCategory(),
                    item.badges(),
                    tip(item.strongestCategory(), item.strongestActivityType())));
        }
        return result;
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new IllegalArgumentException("A valid from and to date are required");
        }
        if (to.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("The end date cannot be in the future");
        }
        if (from.isBefore(to.minusYears(2))) {
            throw new IllegalArgumentException("The leaderboard date range cannot exceed two years");
        }
    }

    private String alias(Long userId) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    salt.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(
                    ("carbontrack-leaderboard:" + userId)
                            .getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                hex.append(String.format("%02X", digest[i]));
            }
            return "Eco-" + hex;
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Unable to generate leaderboard alias", ex);
        }
    }

    private String tip(String category, String activityType) {
        return switch (activityType) {
            case "car_travel" -> "Your recorded travel is led by car journeys. Try replacing one suitable solo trip with a shared ride, public transport, walking or cycling.";
            case "motorcycle_travel" -> "Motorcycle travel is your leading recorded activity. Combine nearby errands and avoid unnecessary trips where practical.";
            case "bus_travel" -> "Bus travel is your leading recorded activity. Keep using shared transport; consider walking or cycling for suitable short journeys.";
            case "train_travel" -> "Train travel is your leading recorded activity. Rail is already a shared option; look for opportunities to combine journeys.";
            case "flight_travel" -> "Flights are your leading recorded activity. Where practical, consider rail for shorter routes or combine trips to reduce flight frequency.";
            case "grid_electricity" -> "Grid electricity is your leading recorded activity. Review high-use appliances and cooling settings, and switch off idle devices.";
            case "beef" -> "Beef is your leading recorded food activity. Consider swapping one meal for a plant-based or lower-impact protein option.";
            case "chicken" -> "Chicken is your leading recorded food activity. Try a plant-based protein option for one meal if it fits your diet.";
            case "plant_based_food" -> "Your leading food activity is plant-based food. Keep logging meals consistently to make the category comparison more complete.";
            case "clothing" -> "Clothing is your leading recorded shopping activity. Prioritise repair, reuse, second-hand items and durable purchases.";
            case "electronics" -> "Electronics are your leading recorded shopping activity. Extend device life through repair and consider refurbished options when replacing.";
            case "paper" -> "Paper is your leading recorded shopping activity. Use digital alternatives where suitable and recycle paper correctly.";
            case "plastic" -> "Plastic is your leading recorded shopping activity. Choose reusable alternatives when practical and avoid unnecessary single-use items.";
            default -> switch (category) {
            case "transport" -> "Try a shared, public or active travel option for suitable trips.";
            case "electricity" -> "Review high-use appliances and shift usage to efficient periods.";
            case "food" -> "Try a lower-impact meal option during the week.";
            case "shopping" -> "Prioritise durable products, repair and reuse.";
            default -> "Keep logging activities to identify your largest impact category.";
            };
        };
    }

    private static final class RankedBuilder {
        private BigDecimal total = BigDecimal.ZERO;
        private final Map<String, BigDecimal> categoryTotals = new HashMap<>();
        private final Map<String, BigDecimal> activityTypeTotals = new HashMap<>();
    }

    private record Ranked(
            BigDecimal total,
            String alias,
            String strongestCategory,
            String strongestActivityType,
            List<String> badges) {
    }
}
