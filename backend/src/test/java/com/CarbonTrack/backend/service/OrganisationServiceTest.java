package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.entity.ActivityLog;
import com.CarbonTrack.backend.entity.Organisation;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.OrganisationRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
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
    void rejectsDashboardAccessForUserWithoutOrganisationMembership() {
        OrganisationRepository organisations = mock(OrganisationRepository.class);
        UserRepository users = mock(UserRepository.class);
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        User member = mock(User.class);

        when(users.findByUsername("member")).thenReturn(Optional.of(member));
        when(member.getRole()).thenReturn("USER");
        when(member.getOrganisation()).thenReturn(null);

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
        ActivityLog zuluLog = activity("5.00", "transport", LocalDate.now());
        ActivityLog alphaLog = activity("5.00", "electricity", LocalDate.now());
        ActivityLog higherLog = activity("9.00", "food", LocalDate.now());

        LocalDate to = LocalDate.now();
        LocalDate from = to.withDayOfMonth(1);

        when(users.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(admin.getRole()).thenReturn("ORG_ADMIN");
        when(admin.getOrganisation()).thenReturn(organisation);
        when(organisation.getId()).thenReturn(25L);
        when(organisation.getName()).thenReturn("Example Org");
        when(users.findAllByOrganisation_Id(25L))
                .thenReturn(List.of(zulu, higher, alpha));
        prepareReportingMember(zulu, 2L, "zulu");
        prepareReportingMember(higher, 3L, "higher");
        prepareReportingMember(alpha, 4L, "alpha");

        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(2L, from, to))
                .thenReturn(List.of(zuluLog));
        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(3L, from, to))
                .thenReturn(List.of(higherLog));
        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(4L, from, to))
                .thenReturn(List.of(alphaLog));

        OrganisationService service = new OrganisationService(
                organisations, users, activities);
        var report = service.dashboard("admin", from, to);

        assertEquals(3, report.employees().size());
        assertEquals("alpha", report.employees().get(0).username());
        assertEquals("zulu", report.employees().get(1).username());
        assertEquals("higher", report.employees().get(2).username());
    }

    @Test
    void organisationReportIncludesOnlyReportingConsentedMembers() {
        OrganisationRepository organisations = mock(OrganisationRepository.class);
        UserRepository users = mock(UserRepository.class);
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        User admin = mock(User.class);
        User optedIn = mock(User.class);
        User optedOut = mock(User.class);
        Organisation organisation = mock(Organisation.class);

        when(users.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(admin.getRole()).thenReturn("ORG_ADMIN");
        when(admin.getOrganisation()).thenReturn(organisation);
        when(organisation.getId()).thenReturn(25L);
        when(organisation.getName()).thenReturn("Example Org");
        when(users.findAllByOrganisation_Id(25L))
                .thenReturn(List.of(optedIn, optedOut));
        prepareReportingMember(optedIn, 10L, "opted-in");
        when(optedOut.isOrganisationReportingOptIn()).thenReturn(false);
        when(optedOut.isOrganisationMembershipActive()).thenReturn(true);

        LocalDate to = LocalDate.now();
        LocalDate from = to.withDayOfMonth(1);
        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(10L, from, to))
                .thenReturn(List.of());

        OrganisationService service = new OrganisationService(
                organisations, users, activities);
        var report = service.dashboard("admin", from, to);

        verify(users).findAllByOrganisation_Id(25L);
        assertEquals("Example Org", report.organisationName());
        assertEquals(BigDecimal.ZERO, report.totalCo2eKg());
        assertEquals(1, report.employees().size());
        assertEquals("opted-in", report.employees().get(0).username());
        assertEquals(BigDecimal.ZERO, report.employees().get(0).totalCo2eKg());
        assertEquals(1, report.monthTrend().size());
        assertEquals(YearMonth.from(to).toString(), report.monthTrend().get(0).month());
    }

    @Test
    void removedMemberActivityRemainsInReportsOnlyThroughLeavingDate() {
        OrganisationRepository organisations = mock(OrganisationRepository.class);
        UserRepository users = mock(UserRepository.class);
        ActivityLogRepository activities = mock(ActivityLogRepository.class);
        User admin = mock(User.class);
        User formerMember = mock(User.class);
        Organisation organisation = mock(Organisation.class);
        LocalDate from = LocalDate.of(2026, 11, 1);
        LocalDate leftAt = LocalDate.of(2026, 11, 10);
        LocalDate to = LocalDate.of(2026, 11, 15);
        ActivityLog log = activity("3.50", "transport", leftAt);

        when(users.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(admin.getRole()).thenReturn("ORG_ADMIN");
        when(admin.getOrganisation()).thenReturn(organisation);
        when(organisation.getId()).thenReturn(25L);
        when(organisation.getName()).thenReturn("Example Org");
        when(users.findAllByOrganisation_Id(25L)).thenReturn(List.of(formerMember));
        when(formerMember.isOrganisationReportingOptIn()).thenReturn(true);
        when(formerMember.isOrganisationMembershipActive()).thenReturn(false);
        when(formerMember.getOrganisationLeftAt()).thenReturn(leftAt);
        when(formerMember.getId()).thenReturn(12L);
        when(formerMember.getUsername()).thenReturn("former-member");
        when(activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(12L, from, leftAt))
                .thenReturn(List.of(log));

        OrganisationService service = new OrganisationService(
                organisations, users, activities);
        var report = service.dashboard("admin", from, to);

        verify(activities).findByUserIdAndLogDateBetweenOrderByLogDateDesc(12L, from, leftAt);
        assertEquals(new BigDecimal("3.50"), report.totalCo2eKg());
        assertEquals(1, report.employees().size());
        assertEquals("former-member", report.employees().get(0).username());
    }

    private void prepareReportingMember(User member, Long id, String username) {
        when(member.getId()).thenReturn(id);
        when(member.getUsername()).thenReturn(username);
        when(member.isOrganisationReportingOptIn()).thenReturn(true);
        when(member.isOrganisationMembershipActive()).thenReturn(true);
        when(member.getOrganisationLeftAt()).thenReturn(null);
    }

    private ActivityLog activity(String amount, String category, LocalDate date) {
        ActivityLog activity = mock(ActivityLog.class);
        when(activity.getCo2eKg()).thenReturn(new BigDecimal(amount));
        when(activity.getCategory()).thenReturn(category);
        when(activity.getLogDate()).thenReturn(date);
        return activity;
    }
}
