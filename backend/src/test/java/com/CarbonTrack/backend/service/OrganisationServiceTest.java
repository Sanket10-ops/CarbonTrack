package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.entity.Organisation;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.OrganisationRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;
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
    void employeeLeaderboardOrdersByFootprintAndUsesUsernameForTies() {
        OrganisationRepository organisations = mock(OrganisationRepository.class);
        UserRepository users = mock(UserRepository.class);
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        User admin = mock(User.class);
        User zulu = mock(User.class);
        User alpha = mock(User.class);
        User higher = mock(User.class);
        Organisation organisation = mock(Organisation.class);
        var zuluLog = mock(com.CarbonTrack.backend.entity.ActivityLog.class);
        var alphaLog = mock(com.CarbonTrack.backend.entity.ActivityLog.class);
        var higherLog = mock(com.CarbonTrack.backend.entity.ActivityLog.class);

        LocalDate to = LocalDate.now();
        LocalDate from = to.withDayOfMonth(1);

        when(users.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(admin.getRole()).thenReturn("ORG_ADMIN");
        when(admin.getOrganisation()).thenReturn(organisation);
        when(organisation.getId()).thenReturn(25L);
        when(organisation.getName()).thenReturn("Example Org");
        when(users.findAllByOrganisation_IdAndOrganisationReportingOptInTrue(25L))
                .thenReturn(List.of(zulu, higher, alpha));

        when(zulu.getId()).thenReturn(2L);
        when(zulu.getUsername()).thenReturn("zulu");
        when(higher.getId()).thenReturn(3L);
        when(higher.getUsername()).thenReturn("higher");
        when(alpha.getId()).thenReturn(4L);
        when(alpha.getUsername()).thenReturn("alpha");

        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(2L, from, to))
                .thenReturn(List.of(zuluLog));
        when(zuluLog.getCo2eKg()).thenReturn(new java.math.BigDecimal("5.00"));
        when(zuluLog.getCategory()).thenReturn("transport");
        when(zuluLog.getLogDate()).thenReturn(to);

        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(3L, from, to))
                .thenReturn(List.of(higherLog));
        when(higherLog.getCo2eKg()).thenReturn(new java.math.BigDecimal("9.00"));
        when(higherLog.getCategory()).thenReturn("food");
        when(higherLog.getLogDate()).thenReturn(to);

        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(4L, from, to))
                .thenReturn(List.of(alphaLog));
        when(alphaLog.getCo2eKg()).thenReturn(new java.math.BigDecimal("5.00"));
        when(alphaLog.getCategory()).thenReturn("electricity");
        when(alphaLog.getLogDate()).thenReturn(to);

        OrganisationService service = new OrganisationService(
                organisations, users, activities);
        var report = service.dashboard("admin", from, to);

        assertEquals(3, report.employees().size());
        assertEquals("alpha", report.employees().get(0).username());
        assertEquals("zulu", report.employees().get(1).username());
        assertEquals("higher", report.employees().get(2).username());
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
        LocalDate to = LocalDate.now();
        LocalDate from = to.withDayOfMonth(1);

        var report = service.dashboard("admin", from, to);

        verify(users).findAllByOrganisation_IdAndOrganisationReportingOptInTrue(25L);
        assertEquals("Example Org", report.organisationName());
        assertEquals(0, report.employees().size());
        assertEquals(1, report.monthTrend().size());
        assertEquals(YearMonth.from(to).toString(), report.monthTrend().get(0).month());
    }
}
