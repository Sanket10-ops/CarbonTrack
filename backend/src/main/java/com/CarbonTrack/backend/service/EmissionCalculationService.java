
package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.entity.EmissionFactor;
import com.CarbonTrack.backend.repository.EmissionFactorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@Transactional(readOnly = true)
public class EmissionCalculationService {

    private final EmissionFactorRepository emissionFactorRepository;

    public EmissionCalculationService(
            EmissionFactorRepository emissionFactorRepository) {
        this.emissionFactorRepository = emissionFactorRepository;
    }

    public BigDecimal calculateEmissions(
            String activityType,
            String unit,
            BigDecimal quantity) {

        if (activityType == null || activityType.isBlank()) {
            throw new IllegalArgumentException(
                    "Activity type must not be blank");
        }

        if (unit == null || unit.isBlank()) {
            throw new IllegalArgumentException(
                    "Unit must not be blank");
        }

        if (quantity == null || quantity.signum() < 0) {
            throw new IllegalArgumentException(
                    "Quantity must not be null or negative");
        }

        EmissionFactor factor = emissionFactorRepository
                .findByActivityTypeAndUnit(activityType, unit)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No emission factor found for activity type '"
                                + activityType + "' and unit '" + unit + "'"));

        if (factor.getKgCo2ePerUnit() == null
                || factor.getKgCo2ePerUnit().signum() < 0) {
            throw new IllegalStateException(
                    "Emission factor must not be null or negative");
        }

        return quantity
                .multiply(factor.getKgCo2ePerUnit())
                .setScale(4, RoundingMode.HALF_UP);
    }
}
