package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.entity.ActivityLog;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatServiceTest {

    @Test
    void footprintAnswerUsesOnlyTheSignedInUsersRecentActivities() {
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        UserRepository users = mock(UserRepository.class);
        GoalService goals = mock(GoalService.class);
        RecommendationService recommendations = mock(RecommendationService.class);
        User user = mock(User.class);
        ActivityLog transport = mock(ActivityLog.class);
        ActivityLog food = mock(ActivityLog.class);

        when(users.findByUsername("ravi")).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(17L);
        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                17L, LocalDate.now().minusDays(29), LocalDate.now()))
                .thenReturn(List.of(transport, food));
        when(transport.getCategory()).thenReturn("transport");
        when(transport.getCo2eKg()).thenReturn(new BigDecimal("8.50"));
        when(transport.getLogDate()).thenReturn(LocalDate.now());
        when(food.getCategory()).thenReturn("food");
        when(food.getCo2eKg()).thenReturn(new BigDecimal("3.25"));
        when(food.getLogDate()).thenReturn(LocalDate.now());

        ChatService service = new ChatService(activities, users, goals, recommendations);
        var answer = service.reply("ravi", "Summarise my carbon footprint");

        assertTrue(answer.reply().contains("11.75 kg CO₂e"));
        assertTrue(answer.reply().contains("Transport"));
        verify(activities).findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                17L, LocalDate.now().minusDays(29), LocalDate.now());
    }

    @Test
    void emptyHistoryDoesNotInventFootprintFigures() {
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        UserRepository users = mock(UserRepository.class);
        GoalService goals = mock(GoalService.class);
        RecommendationService recommendations = mock(RecommendationService.class);
        User user = mock(User.class);

        when(users.findByUsername("ravi")).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(17L);
        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                17L, LocalDate.now().minusDays(29), LocalDate.now()))
                .thenReturn(List.of());

        ChatService service = new ChatService(activities, users, goals, recommendations);
        var answer = service.reply("ravi", "How much is my footprint?");

        assertTrue(answer.reply().contains("There are no activities recorded"));
    }
}
