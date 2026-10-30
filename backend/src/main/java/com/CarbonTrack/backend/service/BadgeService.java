package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.BadgeResponse;
import com.CarbonTrack.backend.entity.Badge;
import com.CarbonTrack.backend.entity.UserBadge;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.BadgeRepository;
import com.CarbonTrack.backend.repository.UserBadgeRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BadgeService {
    private final UserRepository users;
    private final BadgeRepository badges;
    private final UserBadgeRepository userBadges;
    private final ActivityLogRepository activities;
    public BadgeService(UserRepository users, BadgeRepository badges, UserBadgeRepository userBadges,
                        ActivityLogRepository activities) {
        this.users=users; this.badges=badges; this.userBadges=userBadges; this.activities=activities;
    }

    @Transactional
    public List<BadgeResponse> evaluateAndList(String username) {
        var user=users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
        long count=activities.findByUserIdOrderByLogDateDesc(user.getId()).size();
        BigDecimal total=activities.findByUserIdOrderByLogDateDesc(user.getId()).stream()
                .map(a -> a.getCo2eKg()==null?BigDecimal.ZERO:a.getCo2eKg()).reduce(BigDecimal.ZERO,BigDecimal::add);
        award(user, "First Steps", "Log your first activity", "ACTIVITY_COUNT", BigDecimal.ONE, count>=1);
        award(user, "Consistent Tracker", "Log ten activities", "ACTIVITY_COUNT", BigDecimal.TEN, count>=10);
        award(user, "Carbon Cutter", "Record 10 kg CO2e or more", "EMISSIONS_TRACKED", BigDecimal.TEN, total.compareTo(BigDecimal.TEN)>=0);
        return userBadges.findByUserIdOrderByAwardedAtDesc(user.getId()).stream()
                .map(ub -> new BadgeResponse(ub.getBadge().getId(),ub.getBadge().getName(),
                        ub.getBadge().getDescription(),ub.getBadge().getTriggerType(),ub.getAwardedAt())).toList();
    }

    private void award(com.CarbonTrack.backend.entity.User user, String name, String description,
                       String trigger, BigDecimal threshold, boolean eligible) {
        if (!eligible) return;
        Badge badge=badges.findByName(name).orElseGet(() -> badges.save(new Badge(name,description,trigger,threshold)));
        if (!userBadges.existsByUserIdAndBadgeId(user.getId(),badge.getId()))
            userBadges.save(new UserBadge(user,badge, LocalDateTime.now()));
    }
}