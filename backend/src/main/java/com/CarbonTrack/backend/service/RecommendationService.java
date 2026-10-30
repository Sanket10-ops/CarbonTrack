package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.RecommendationResponse;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class RecommendationService {
    private final ActivityLogRepository activities;
    private final UserRepository users;
    public RecommendationService(ActivityLogRepository activities, UserRepository users) {
        this.activities = activities; this.users = users;
    }

    @Transactional(readOnly = true)
    public List<RecommendationResponse> recommendations(String username) {
        var user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
        var logs = activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                user.getId(), LocalDate.now().minusDays(29), LocalDate.now());
        Map<String, BigDecimal> totals = new HashMap<>();
        logs.forEach(a -> totals.merge(a.getCategory(), a.getCo2eKg(), BigDecimal::add));
        if (totals.isEmpty()) return List.of(
                new RecommendationResponse("getting-started", "Start tracking",
                        "Log transport, electricity, food, and shopping activities.",
                        "Recommendations become more useful after you record activities."));
        return totals.entrySet().stream().sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(3).map(e -> switch (e.getKey().toLowerCase(Locale.ROOT)) {
                    case "transport" -> new RecommendationResponse("transport", "Choose lower-carbon travel",
                            "Replace short car trips with walking, cycling, public transport, or shared rides.",
                            "Transport is one of your largest recorded emission categories.");
                    case "electricity" -> new RecommendationResponse("electricity", "Reduce electricity use",
                            "Switch off idle devices, use efficient appliances, and consider renewable electricity.",
                            "Electricity is one of your largest recorded emission categories.");
                    case "food" -> new RecommendationResponse("food", "Try lower-impact meals",
                            "Replace some high-impact meals with plant-based options.",
                            "Food is one of your largest recorded emission categories.");
                    default -> new RecommendationResponse("shopping", "Buy thoughtfully",
                            "Prefer durable, repairable, second-hand products and avoid unnecessary purchases.",
                            "Shopping is one of your largest recorded emission categories.");
                }).toList();
    }
}