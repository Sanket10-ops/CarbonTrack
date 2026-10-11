
package com.CarbonTrack.backend.repository;

import com.CarbonTrack.backend.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ActivityLogRepository
        extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByUserIdOrderByLogDateDesc(Long userId);

    List<ActivityLog> findByUserIdAndLogDateBetweenOrderByLogDateDesc(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );
}
