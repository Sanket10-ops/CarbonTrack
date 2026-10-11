
package com.CarbonTrack.backend.repository;

import com.CarbonTrack.backend.entity.EmissionFactor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmissionFactorRepository
        extends JpaRepository<EmissionFactor, Long> {

    Optional<EmissionFactor> findByActivityTypeAndUnit(
            String activityType,
            String unit
    );
}
