package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.entity.Organisation;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.OrganisationRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OrganisationServiceTest {

    @Test
    void rejectsDashboardAccessForNonAdministrator() {
        OrganisationRepository organisations = mock(OrganisationRepository.class);
        UserRepository users = mock(UserRepository.class);
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        User member = mock(User.class);

        when(users.findByUsername("member")).thenReturn(java.util.Optional.of(member));
        when(member.getRole()).thenReturn("USER");
        when(member.getOrganisation()).thenReturn(mock(Organisation.class));

        OrganisationService service = new OrganisationService(
                organisations, users, activities);

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.dashboard("member", LocalDate.now().minusDays(1), LocalDate.now()));
    }
}
