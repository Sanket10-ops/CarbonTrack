package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.LeaderboardActivityProjection;
import com.CarbonTrack.backend.repository.UserBadgeNameProjection;
import com.CarbonTrack.backend.repository.UserBadgeRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LeaderboardServiceTest {

    @Test
    void returnsLowestFootprintsWithAnonymousAliasesAndNoMoreThanRequestedLimit() {
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        UserBadgeRepository badges = mock(UserBadgeRepository.class);

        LeaderboardActivityProjection first = row(10L, "transport", "4.25");
        LeaderboardActivityProjection secondTransport = row(20L, "transport", "8.00");
        LeaderboardActivityProjection secondFood = row(20L, "food", "2.00");
        when(activities.aggregateOptedInLeaderboard(
                LocalDate.now().minusDays(7), LocalDate.now()))
                .thenReturn(List.of(secondTransport, first, secondFood));
        when(badges.findBadgeNamesForUsers(List.of(10L, 20L)))
                .thenReturn(List.of());

        LeaderboardService service = new LeaderboardService(
                activities, badges, "test-only-secret-with-sufficient-length");

        var result = service.getLeaderboard(
                LocalDate.now().minusDays(7), LocalDate.now(), 1);

        assertEquals(1, result.size());
        assertEquals(1, result.get(0).rank());
        assertEquals(new BigDecimal("4.25"), result.get(0).totalCo2eKg());
        assertEquals("transport", result.get(0).strongestCategory());
        assertEquals(true, result.get(0).displayAlias().matches("Eco-[0-9A-F]{16}"));
    }

    private LeaderboardActivityProjection row(Long userId, String category, String total) {
        LeaderboardActivityProjection projection = mock(LeaderboardActivityProjection.class);
        when(projection.getUserId()).thenReturn(userId);
        when(projection.getCategory()).thenReturn(category);
        when(projection.getTotalEmissionsKg()).thenReturn(new BigDecimal(total));
        return projection;
    }
}
