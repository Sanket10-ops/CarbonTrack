package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.GoalProgressResponse;
import com.CarbonTrack.backend.dto.GoalRequest;
import com.CarbonTrack.backend.dto.GoalResponse;
import com.CarbonTrack.backend.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse createGoal(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody GoalRequest request) {
        return goalService.createGoal(jwt.getSubject(), request);
    }

    @GetMapping
    public List<GoalResponse> getGoals(@AuthenticationPrincipal Jwt jwt) {
        return goalService.getGoals(jwt.getSubject());
    }

    @GetMapping("/{goalId}")
    public GoalResponse getGoal(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long goalId) {
        return goalService.getGoal(jwt.getSubject(), goalId);
    }

    @PutMapping("/{goalId}")
    public GoalResponse updateGoal(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long goalId,
            @Valid @RequestBody GoalRequest request) {
        return goalService.updateGoal(jwt.getSubject(), goalId, request);
    }

    @DeleteMapping("/{goalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGoal(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long goalId) {
        goalService.deleteGoal(jwt.getSubject(), goalId);
    }

    @GetMapping("/{goalId}/progress")
    public GoalProgressResponse getProgress(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long goalId) {
        return goalService.getProgress(jwt.getSubject(), goalId);
    }
}
