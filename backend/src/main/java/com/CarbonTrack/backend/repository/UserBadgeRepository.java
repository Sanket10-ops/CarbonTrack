package com.CarbonTrack.backend.repository;

import com.CarbonTrack.backend.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserIdOrderByAwardedAtDesc(Long userId);

    boolean existsByUserIdAndBadgeId(Long userId, Long badgeId);

    @Query("""
            select ub.user.id as userId,
                   ub.badge.name as badgeName
            from UserBadge ub
            where ub.user.id in :userIds
            order by ub.awardedAt desc
            """)
    List<UserBadgeNameProjection> findBadgeNamesForUsers(@Param("userIds") List<Long> userIds);
}
