package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.GoalRequest;
import com.CarbonTrack.backend.entity.ActivityLog;
import com.CarbonTrack.backend.entity.Goal;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.GoalRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GoalServiceTest {

    private GoalRepository goalRepository;
    private UserRepository userRepository;
    private ActivityLogRepository activityLogRepository;
    private GoalService service;
    private User user;

    @BeforeEach
    void setUp() {
        goalRepository = mock(GoalRepository.class);
        userRepository = mock(UserRepository.class);
        activityLogRepository = mock(ActivityLogRepository.class);
        service = new GoalService(goalRepository, userRepository, activityLogRepository);

        user = mock(User.class);
        when(user.getId()).thenReturn(7L);
        when(userRepository.findByUsername("sanket")).thenReturn(Optional.of(user));
    }

    @Test
    void createsGoalForAuthenticatedUser() {
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> {
            Goal saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 12L);
            return saved;
        });

        var result = service.createGoal("sanket", request("15", 30, LocalDate.now()));

        assertEquals(12L, result.id());
        assertEquals(new BigDecimal("15"), result.targetReductionPct());
        assertEquals(30, result.periodDays());
        assertEquals("ACTIVE", result.status());
        assertEquals(result.startDate().plusDays(29), result.endDate());
        verify(goalRepository).save(any(Goal.class));
    }

    @Test
    void rejectsGoalWithOutOfRangeTarget() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> service.createGoal("sanket", request("101", 30, LocalDate.now())));
        assertEquals(400, ex.getStatusCode().value());
        verify(goalRepository, never()).save(any());
    }

    @Test
    void rejectsTargetOfZero() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> service.createGoal("sanket", request("0", 30, LocalDate.now())));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void rejectsDurationBelowSevenDays() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> service.createGoal("sanket", request("15", 6, LocalDate.now())));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void rejectsMissingAuthenticatedUser() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        var ex = assertThrows(ResponseStatusException.class,
                () -> service.getGoals("unknown"));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void listsOnlyAuthenticatedUsersGoals() {
        Goal goal = new Goal(user, new BigDecimal("15"), 30, LocalDate.now(), "ACTIVE");
        ReflectionTestUtils.setField(goal, "id", 13L);
        when(goalRepository.findAllByUserIdOrderByStartDateDesc(7L)).thenReturn(List.of(goal));

        var results = service.getGoals("sanket");

        assertEquals(1, results.size());
        assertEquals(13L, results.get(0).id());
        verify(goalRepository).findAllByUserIdOrderByStartDateDesc(7L);
    }

    @Test
    void doesNotExposeAnotherUsersGoal() {
        when(goalRepository.findByIdAndUserId(99L, 7L)).thenReturn(Optional.empty());
        var ex = assertThrows(ResponseStatusException.class, () -> service.getGoal("sanket", 99L));
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void updatesAnActiveOwnedGoal() {
        LocalDate start = LocalDate.now();
        Goal goal = new Goal(user, new BigDecimal("10"), 30, start, "ACTIVE");
        ReflectionTestUtils.setField(goal, "id", 22L);
        when(goalRepository.findByIdAndUserId(22L, 7L)).thenReturn(Optional.of(goal));
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.updateGoal("sanket", 22L, request("25", 45, start.plusDays(1)));

        assertEquals(new BigDecimal("25"), result.targetReductionPct());
        assertEquals(45, result.periodDays());
        assertEquals(start.plusDays(1), result.startDate());
        verify(goalRepository).save(goal);
    }

    @Test
    void refusesToUpdateCompletedGoal() {
        Goal goal = new Goal(user, new BigDecimal("10"), 30, LocalDate.now(), "ACHIEVED");
        ReflectionTestUtils.setField(goal, "id", 23L);
        when(goalRepository.findByIdAndUserId(23L, 7L)).thenReturn(Optional.of(goal));

        var ex = assertThrows(ResponseStatusException.class,
                () -> service.updateGoal("sanket", 23L,
                        request("25", 45, LocalDate.now())));

        assertEquals(409, ex.getStatusCode().value());
        verify(goalRepository, never()).save(any());
    }

    @Test
    void deletesOnlyAnOwnedGoal() {
        Goal goal = new Goal(user, new BigDecimal("10"), 30, LocalDate.now(), "ACTIVE");
        ReflectionTestUtils.setField(goal, "id", 24L);
        when(goalRepository.findByIdAndUserId(24L, 7L)).thenReturn(Optional.of(goal));

        service.deleteGoal("sanket", 24L);

        verify(goalRepository).delete(goal);
    }

    @Test
    void calculatesGoalProjectionAndOnTrackStatus() {
        LocalDate today = LocalDate.now();
        Goal goal = goal(33L, "20", 30, today, "ACTIVE");
        when(goalRepository.findByIdAndUserId(33L, 7L)).thenReturn(Optional.of(goal));
        when(activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, today.minusDays(30), today.minusDays(1)))
                .thenReturn(List.of(activity(today.minusDays(1), "100.0000")));
        when(activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, today, today)).thenReturn(List.of(activity(today, "2.0000")));

        var progress = service.getProgress("sanket", 33L);

        assertEquals(new BigDecimal("100.0000"), progress.baselineFootprintKg());
        assertEquals(new BigDecimal("80.0000"), progress.targetFootprintKg());
        assertEquals(new BigDecimal("2.0000"), progress.currentFootprintKg());
        assertEquals(new BigDecimal("60.0000"), progress.projectedFootprintKg());
        assertEquals(Boolean.TRUE, progress.onTrack());
        assertTrue(progress.alerts().stream().anyMatch(a -> a.startsWith("ON_TRACK")));
    }

    @Test
    void futureGoalIsReportedAsNotStarted() {
        LocalDate start = LocalDate.now().plusDays(2);
        Goal goal = goal(34L, "20", 30, start, "ACTIVE");
        when(goalRepository.findByIdAndUserId(34L, 7L)).thenReturn(Optional.of(goal));
        when(activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, start.minusDays(30), start.minusDays(1))).thenReturn(List.of());

        var progress = service.getProgress("sanket", 34L);

        assertNull(progress.onTrack());
        assertNull(progress.projectedFootprintKg());
        assertTrue(progress.alerts().stream().anyMatch(a -> a.startsWith("NOT_STARTED")));
        assertEquals(0, progress.elapsedDays());
    }

    @Test
    void marksExpiredGoalAchievedWhenCurrentFootprintMeetsTarget() {
        LocalDate start = LocalDate.now().minusDays(30);
        LocalDate end = start.plusDays(29);
        Goal goal = goal(35L, "20", 30, start, "ACTIVE");
        when(goalRepository.findByIdAndUserId(35L, 7L)).thenReturn(Optional.of(goal));
        when(activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, start.minusDays(30), start.minusDays(1)))
                .thenReturn(List.of(activity(start.minusDays(1), "100.0000")));
        when(activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, start, end)).thenReturn(List.of(activity(end, "70.0000")));
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var progress = service.getProgress("sanket", 35L);

        assertEquals("ACHIEVED", progress.status());
        assertEquals("ACHIEVED", goal.getStatus());
        verify(goalRepository).save(goal);
    }

    @Test
    void marksExpiredGoalMissedWhenCurrentFootprintExceedsTarget() {
        LocalDate start = LocalDate.now().minusDays(30);
        LocalDate end = start.plusDays(29);
        Goal goal = goal(36L, "20", 30, start, "ACTIVE");
        when(goalRepository.findByIdAndUserId(36L, 7L)).thenReturn(Optional.of(goal));
        when(activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, start.minusDays(30), start.minusDays(1)))
                .thenReturn(List.of(activity(start.minusDays(1), "100.0000")));
        when(activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, start, end)).thenReturn(List.of(activity(end, "95.0000")));
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var progress = service.getProgress("sanket", 36L);

        assertEquals("MISSED", progress.status());
        assertEquals("MISSED", goal.getStatus());
        assertTrue(progress.alerts().stream().anyMatch(a -> a.startsWith("GOAL_MISSED")));
    }

    @Test
    void reportsUnavailableBaselineWithoutInventingProjection() {
        LocalDate today = LocalDate.now();
        Goal goal = goal(37L, "20", 30, today, "ACTIVE");
        when(goalRepository.findByIdAndUserId(37L, 7L)).thenReturn(Optional.of(goal));
        when(activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, today.minusDays(30), today.minusDays(1))).thenReturn(List.of());
        when(activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                7L, today, today)).thenReturn(List.of(activity(today, "3.0000")));

        var progress = service.getProgress("sanket", 37L);

        assertEquals(new BigDecimal("0.0000"), progress.baselineFootprintKg());
        assertNull(progress.projectedFootprintKg());
        assertNull(progress.onTrack());
        assertTrue(progress.alerts().stream().anyMatch(a -> a.startsWith("BASELINE_UNAVAILABLE")));
    }

    private GoalRequest request(String target, int days, LocalDate start) {
        return new GoalRequest(new BigDecimal(target), days, start);
    }

    private Goal goal(Long id, String target, int days, LocalDate start, String status) {
        Goal goal = new Goal(user, new BigDecimal(target), days, start, status);
        ReflectionTestUtils.setField(goal, "id", id);
        return goal;
    }

    private ActivityLog activity(LocalDate date, String emissions) {
        return new ActivityLog(user, "transport", "car_travel", BigDecimal.ONE,
                "km", new BigDecimal(emissions), date);
    }
}
