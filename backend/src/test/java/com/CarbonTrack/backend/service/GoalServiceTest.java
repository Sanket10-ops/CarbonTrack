package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.GoalProgressResponse;
import com.CarbonTrack.backend.entity.ActivityLog;
import com.CarbonTrack.backend.entity.Goal;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.GoalRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GoalServiceTest {

    @Test
    void activeGoalRemainsInProgressWhenTargetIsReachedEarly() {
        UserRepository users = mock(UserRepository.class);
        GoalRepository goals = mock(GoalRepository.class);
        ActivityLogRepository activities = mock(ActivityLogRepository.class);

        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);
        when(users.findByUsername("tester")).thenReturn(Optional.of(user));

        LocalDate today = LocalDate.now();
        Goal goal = mock(Goal.class);
        when(goal.getId()).thenReturn(55L);
        when(goal.getStartDate()).thenReturn(today);
        when(goal.getPeriodDays()).thenReturn(7);
        when(goal.getTargetReductionPct()).thenReturn(new BigDecimal("20"));
        when(goals.findByIdAndUserId(55L, 7L)).thenReturn(Optional.of(goal));

        ActivityLog baselineActivity = mock(ActivityLog.class);
        when(baselineActivity.getCo2eKg()).thenReturn(new BigDecimal("3.8400"));
        ActivityLog currentActivity = mock(ActivityLog.class);
        when(currentActivity.getCo2eKg()).thenReturn(new BigDecimal("1.9200"));

        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, today.minusDays(1), today.minusDays(1)))
                .thenReturn(List.of(baselineActivity));
        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, today, today))
                .thenReturn(List.of(currentActivity));

        GoalService service = new GoalService(goals, users, activities);

        GoalProgressResponse progress = service.progress("tester", 55L);

        assertEquals(0, progress.reductionPct().compareTo(new BigDecimal("50.00")));
        assertEquals("IN_PROGRESS", progress.status());
    }
}
