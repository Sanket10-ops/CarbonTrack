package com.CarbonTrack.backend.repository;

import com.CarbonTrack.backend.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserIdOrderByAwardedAtDesc(Long userId);
    boolean existsByUserIdAndBadgeId(Long userId, Long badgeId);
}