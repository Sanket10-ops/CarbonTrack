
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
import java.util.Locale;

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

        String category = request.category().toLowerCase(Locale.ROOT);
        String activityType = request.activityType().toLowerCase(Locale.ROOT);

        validateCategory(category, activityType);
        validateCategoryDetails(category, activityType, request);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Authenticated user not found"));

        BigDecimal quantity = request.quantity();
        String unit = request.unit();

        if ("transport".equals(category) && "flight_travel".equals(activityType)) {
            if (request.flightDistanceKm() == null) {
                throw new IllegalArgumentException(
                        "Flight distance is required for flight travel");
            }
            quantity = request.flightDistanceKm();
            unit = "passenger-km";
        }

        BigDecimal co2eKg = emissionCalculationService.calculateEmissions(
                activityType, unit, quantity);

        ActivityLog activityLog = new ActivityLog(
                user,
                category,
                activityType,
                quantity,
                unit,
                co2eKg,
                request.logDate(),
                request.energySource(),
                request.mealType(),
                request.servings(),
                request.productCategory(),
                request.spendAmount(),
                request.spendCurrency() == null
                        ? null : request.spendCurrency().toUpperCase(Locale.ROOT),
                request.flightDistanceKm()
        );

        return activityLogRepository.save(activityLog);
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> getActivitiesForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Authenticated user not found"));

        return activityLogRepository.findByUserIdOrderByLogDateDesc(user.getId());
    }

    private void validateCategoryDetails(
            String category, String activityType, CreateActivityRequest request) {

        switch (category) {
            case "transport" -> {
                if ("flight_travel".equals(activityType)) {
                    requirePresent(request.flightDistanceKm(), "Flight distance");
                    rejectPresent(request.energySource(), "Energy source");
                    rejectPresent(request.mealType(), "Meal type");
                    rejectPresent(request.servings(), "Servings");
                    rejectPresent(request.productCategory(), "Product category");
                    rejectPresent(request.spendAmount(), "Spend amount");
                    rejectPresent(request.spendCurrency(), "Spend currency");
                } else {
                    rejectPresent(request.flightDistanceKm(), "Flight distance");
                    rejectPresent(request.energySource(), "Energy source");
                    rejectPresent(request.mealType(), "Meal type");
                    rejectPresent(request.servings(), "Servings");
                    rejectPresent(request.productCategory(), "Product category");
                    rejectPresent(request.spendAmount(), "Spend amount");
                    rejectPresent(request.spendCurrency(), "Spend currency");
                }
            }
            case "electricity" -> {
                requireText(request.energySource(), "Energy source");
                rejectPresent(request.mealType(), "Meal type");
                rejectPresent(request.servings(), "Servings");
                rejectPresent(request.productCategory(), "Product category");
                rejectPresent(request.spendAmount(), "Spend amount");
                rejectPresent(request.spendCurrency(), "Spend currency");
                rejectPresent(request.flightDistanceKm(), "Flight distance");
            }
            case "food" -> {
                requireText(request.mealType(), "Meal type");
                requirePresent(request.servings(), "Servings");
                rejectPresent(request.energySource(), "Energy source");
                rejectPresent(request.productCategory(), "Product category");
                rejectPresent(request.spendAmount(), "Spend amount");
                rejectPresent(request.spendCurrency(), "Spend currency");
                rejectPresent(request.flightDistanceKm(), "Flight distance");
            }
            case "shopping" -> {
                requireText(request.productCategory(), "Product category");
                requirePresent(request.spendAmount(), "Spend amount");
                requireText(request.spendCurrency(), "Spend currency");
                rejectPresent(request.energySource(), "Energy source");
                rejectPresent(request.mealType(), "Meal type");
                rejectPresent(request.servings(), "Servings");
                rejectPresent(request.flightDistanceKm(), "Flight distance");
            }
            default -> throw new IllegalArgumentException("Unsupported category");
        }
    }

    private void validateCategory(String category, String activityType) {
        boolean valid = switch (category) {
            case "transport" ->
                    List.of("car_travel", "motorcycle_travel", "bus_travel",
                            "train_travel", "flight_travel").contains(activityType);
            case "electricity" -> "grid_electricity".equals(activityType);
            case "food" ->
                    List.of("beef", "chicken", "plant_based_food").contains(activityType);
            case "shopping" ->
                    List.of("clothing", "electronics", "paper", "plastic")
                            .contains(activityType);
            default -> false;
        };

        if (!valid) {
            throw new IllegalArgumentException(
                    "Activity type '" + activityType
                            + "' does not belong to category '" + category + "'");
        }
    }

    private void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
    }

    private void requirePresent(BigDecimal value, String field) {
        if (value == null) {
            throw new IllegalArgumentException(field + " is required");
        }
    }

    private void rejectPresent(Object value, String field) {
        if (value != null) {
            throw new IllegalArgumentException(
                    field + " is not applicable to this activity category");
        }
    }
}
