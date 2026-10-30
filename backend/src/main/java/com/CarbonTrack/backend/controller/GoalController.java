package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.CreateGoalRequest;
import com.CarbonTrack.backend.dto.GoalProgressResponse;
import com.CarbonTrack.backend.entity.Goal;
import com.CarbonTrack.backend.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {
    private final GoalService service;
    public GoalController(GoalService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Goal create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateGoalRequest request) {
        return service.create(jwt.getSubject(), request);
    }

    @GetMapping
    public List<Goal> list(@AuthenticationPrincipal Jwt jwt) { return service.list(jwt.getSubject()); }

    @GetMapping("/{id}/progress")
    public GoalProgressResponse progress(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.progress(jwt.getSubject(), id);
    }
}