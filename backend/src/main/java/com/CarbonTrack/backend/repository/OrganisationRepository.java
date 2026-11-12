package com.CarbonTrack.backend.repository;

import com.CarbonTrack.backend.entity.Organisation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganisationRepository extends JpaRepository<Organisation, Long> {
}
