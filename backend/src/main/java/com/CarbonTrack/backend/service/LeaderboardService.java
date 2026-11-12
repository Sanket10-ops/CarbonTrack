package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.LeaderboardEntryResponse;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.UserBadgeRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
public class LeaderboardService {
    private final ActivityLogRepository activities;
    private final UserRepository users;
    private final UserBadgeRepository badges;
    private final String salt;

    public LeaderboardService(ActivityLogRepository activities, UserRepository users,
                              UserBadgeRepository badges,
                              @Value("${carbontrack.leaderboard.salt}") String salt) {
        this.activities = activities;
        this.users = users;
        this.badges = badges;
        this.salt = salt;
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> getLeaderboard(LocalDate from, LocalDate to, int limit) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new IllegalArgumentException("A valid from and to date are required");
        }
        int safeLimit = Math.max(1, Math.min(limit, 50));
        var enabledUsers = users.findAllByLeaderboardOptInTrue();
        List<Ranked> ranked = new ArrayList<>();

        for (var user : enabledUsers) {
            var rows = activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                    user.getId(), from, to);
            BigDecimal total = rows.stream().map(a -> a.getCo2eKg() == null
                    ? BigDecimal.ZERO : a.getCo2eKg()).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (rows.isEmpty()) continue;

            var categoryTotals = new java.util.TreeMap<String, BigDecimal>();
            rows.forEach(a -> categoryTotals.merge(a.getCategory().toLowerCase(Locale.ROOT),
                    a.getCo2eKg() == null ? BigDecimal.ZERO : a.getCo2eKg(), BigDecimal::add));
            String strongest = categoryTotals.entrySet().stream()
                    .max(java.util.Map.Entry.comparingByValue())
                    .map(java.util.Map.Entry::getKey).orElse("not_recorded");
            List<String> badgeNames = badges.findNamesByUserId(user.getId());
            ranked.add(new Ranked(total, alias(user.getId()), strongest, badgeNames));
        }

        ranked.sort(Comparator.comparing(Ranked::total)
                .thenComparing(Ranked::alias));
        List<LeaderboardEntryResponse> result = new ArrayList<>();
        for (int i = 0; i < Math.min(safeLimit, ranked.size()); i++) {
            Ranked item = ranked.get(i);
            result.add(new LeaderboardEntryResponse(i + 1, item.alias(), item.total(),
                    item.strongest(), item.badges(), tip(item.strongest())));
        }
        return result;
    }

    private String alias(Long id) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest((salt + ":" + id).getBytes(StandardCharsets.UTF_8));
            return "Eco-" + HexFormat.of().formatHex(hash, 0, 4).toUpperCase(Locale.ROOT);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    private String tip(String category) {
        return switch (category) {
            case "transport" -> "Try a shared, public or active travel option for suitable trips.";
            case "electricity" -> "Review high-use appliances and shift usage to efficient periods.";
            case "food" -> "Try a lower-impact meal option during the week.";
            case "shopping" -> "Prioritise durable products, repair and reuse.";
            default -> "Keep logging activities to identify your largest impact category.";
        };
    }

    private record Ranked(BigDecimal total, String alias, String strongest, List<String> badges) {}
}
