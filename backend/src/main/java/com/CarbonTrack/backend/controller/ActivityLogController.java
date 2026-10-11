
package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.ActivityResponse;
import com.CarbonTrack.backend.dto.CreateActivityRequest;
import com.CarbonTrack.backend.service.ActivityLogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
            @RequestParam Long userId,
            @Valid @RequestBody CreateActivityRequest request) {

        return ActivityResponse.from(
                activityLogService.createActivity(userId, request)
        );
    }

    @GetMapping
    public List<ActivityResponse> getActivities(
            @RequestParam Long userId) {

        return activityLogService.getActivitiesForUser(userId)
                .stream()
                .map(ActivityResponse::from)
                .toList();
    }
}
