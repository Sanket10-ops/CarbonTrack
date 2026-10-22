
package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.CreateActivityRequest;
import com.CarbonTrack.backend.entity.ActivityLog;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;

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
    @CacheEvict(cacheNames = "footprintAnalytics", allEntries = true)
    public ActivityLog createActivity(
            String username, CreateActivityRequest request) {
        validateCategory(request.category(), request.activityType());

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Authenticated user not found"));

        BigDecimal co2eKg =
                emissionCalculationService.calculateEmissions(
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
    public List<ActivityLog> getActivitiesForUser(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Authenticated user not found"));

        return activityLogRepository
                .findByUserIdOrderByLogDateDesc(user.getId());
    }

    private void validateCategory(String category, String activityType) {
        String normalizedCategory = category.toLowerCase();
        String normalizedType = activityType.toLowerCase();

        boolean valid = switch (normalizedCategory) {
            case "transport" ->
                    normalizedType.equals("car_travel")
                            || normalizedType.equals("motorcycle_travel")
                            || normalizedType.equals("bus_travel")
                            || normalizedType.equals("train_travel");

            case "electricity" ->
                    normalizedType.equals("grid_electricity");

            case "food" ->
                    normalizedType.equals("beef")
                            || normalizedType.equals("chicken")
                            || normalizedType.equals("plant_based_food");

            case "shopping" ->
                    normalizedType.equals("clothing")
                            || normalizedType.equals("electronics")
                            || normalizedType.equals("paper")
                            || normalizedType.equals("plastic");

            default -> false;
        };

        if (!valid) {
            throw new IllegalArgumentException(
                    "Activity type '" + activityType
                            + "' does not belong to category '" + category + "'");
        }
    }

}
