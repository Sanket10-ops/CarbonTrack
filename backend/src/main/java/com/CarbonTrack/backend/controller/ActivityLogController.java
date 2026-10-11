
package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.ActivityResponse;
import com.CarbonTrack.backend.dto.CreateActivityRequest;
import com.CarbonTrack.backend.service.ActivityLogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ActivityResponse createActivity(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateActivityRequest request) {

        return ActivityResponse.from(
                activityLogService.createActivity(
                        jwt.getSubject(), request)
        );
    }

    @GetMapping
    public List<ActivityResponse> getActivities(
            @AuthenticationPrincipal Jwt jwt) {

        return activityLogService
                .getActivitiesForUser(jwt.getSubject())
                .stream()
                .map(ActivityResponse::from)
                .toList();
    }
}
