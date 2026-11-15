package com.CarbonTrack.backend.repository;

import com.CarbonTrack.backend.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ActivityLogRepository
        extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByUserIdOrderByLogDateDesc(Long userId);

    long countByUserId(Long userId);

    @Query("""
            select coalesce(sum(a.co2eKg), 0)
            from ActivityLog a
            where a.user.id = :userId
            """)
    BigDecimal sumEmissionsByUserId(@Param("userId") Long userId);

    @Query("""
            select coalesce(sum(a.co2eKg), 0)
            from ActivityLog a
            where a.user.goalVisibility = true
              and a.logDate between :startDate and :endDate
            """)
    BigDecimal sumOptedInUserEmissionsByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    List<ActivityLog> findByUserIdAndLogDateBetweenOrderByLogDateDesc(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("""
            select a.user.id as userId,
                   a.category as category,
                   a.activityType as activityType,
                   sum(a.co2eKg) as totalEmissionsKg
            from ActivityLog a
            where a.user.leaderboardOptIn = true
              and a.logDate between :fromDate and :toDate
            group by a.user.id, a.category, a.activityType
            """)
    List<LeaderboardActivityProjection> aggregateOptedInLeaderboard(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            select a.category as category,
                   sum(a.co2eKg) as totalEmissions
            from ActivityLog a
            where a.user.id = :userId
              and a.logDate between :startDate and :endDate
            group by a.category
            order by a.category
            """)
    List<CategoryEmissionProjection> sumEmissionsByCategoryAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            select a.logDate as logDate,
                   sum(a.co2eKg) as totalEmissions
            from ActivityLog a
            where a.user.id = :userId
              and a.logDate between :startDate and :endDate
            group by a.logDate
            order by a.logDate
            """)
    List<DateEmissionProjection> sumEmissionsByDateAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

}
