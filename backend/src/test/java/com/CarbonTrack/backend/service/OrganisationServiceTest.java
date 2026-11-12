package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.entity.Organisation;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.OrganisationRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrganisationServiceTest {

    @Test
    void rejectsDashboardAccessForNonAdministrator() {
        OrganisationRepository organisations = mock(OrganisationRepository.class);
        UserRepository users = mock(UserRepository.class);
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        User member = mock(User.class);

        when(users.findByUsername("member")).thenReturn(Optional.of(member));
        when(member.getRole()).thenReturn("USER");

        OrganisationService service = new OrganisationService(
                organisations, users, activities);

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.dashboard("member", LocalDate.now().minusDays(1), LocalDate.now()));
    }

    @Test
    void organisationReportQueriesOnlyMembersWhoOptedIn() {
        OrganisationRepository organisations = mock(OrganisationRepository.class);
        UserRepository users = mock(UserRepository.class);
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        User admin = mock(User.class);
        Organisation organisation = mock(Organisation.class);

        when(users.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(admin.getRole()).thenReturn("ORG_ADMIN");
        when(admin.getOrganisation()).thenReturn(organisation);
        when(organisation.getId()).thenReturn(25L);
        when(organisation.getName()).thenReturn("Example Org");
        when(users.findAllByOrganisation_IdAndOrganisationReportingOptInTrue(25L))
                .thenReturn(List.of());

        OrganisationService service = new OrganisationService(
                organisations, users, activities);
        LocalDate from = LocalDate.of(2026, 11, 1);
        LocalDate to = LocalDate.of(2026, 11, 30);

        var report = service.dashboard("admin", from, to);

        verify(users).findAllByOrganisation_IdAndOrganisationReportingOptInTrue(25L);
        assertEquals("Example Org", report.organisationName());
        assertEquals(0, report.employees().size());
        assertEquals(1, report.monthTrend().size());
        assertEquals("2026-11", report.monthTrend().get(0).month());
    }
}
