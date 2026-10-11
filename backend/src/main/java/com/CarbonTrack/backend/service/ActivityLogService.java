
package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.CreateActivityRequest;
import com.CarbonTrack.backend.entity.ActivityLog;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final EmissionCalculationService emissionCalculationService;

    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            EmissionCalculationService emissionCalculationService) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.emissionCalculationService = emissionCalculationService;
    }

    @Transactional
    public ActivityLog createActivity(Long userId, CreateActivityRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User not found with ID: " + userId));

        BigDecimal co2eKg = emissionCalculationService.calculateEmissions(
                request.activityType(),
                request.unit(),
                request.quantity()
        );

        ActivityLog activityLog = new ActivityLog(
                user,
                request.category().toLowerCase(),
                request.activityType(),
                request.quantity(),
                request.unit(),
                co2eKg,
                request.logDate()
        );

        return activityLogRepository.save(activityLog);
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> getActivitiesForUser(Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException(
                    "User not found with ID: " + userId);
        }

        return activityLogRepository
                .findByUserIdOrderByLogDateDesc(userId);
    }
}
