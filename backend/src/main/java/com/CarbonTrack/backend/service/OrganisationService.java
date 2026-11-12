package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.OrganisationDashboardResponse;
import com.CarbonTrack.backend.entity.Organisation;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.OrganisationRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrganisationService {
    private final OrganisationRepository organisations;
    private final UserRepository users;
    private final ActivityLogRepository activities;

    public OrganisationService(OrganisationRepository organisations, UserRepository users,
                               ActivityLogRepository activities) {
        this.organisations = organisations;
        this.users = users;
        this.activities = activities;
    }

    @Transactional
    public Organisation create(String username, String name) {
        var admin = user(username);
        if (admin.getOrganisation() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already belong to an organisation");
        }
        Organisation org = organisations.save(new Organisation(name.trim()));
        admin.setOrganisation(org);
        admin.setRole("ORG_ADMIN");
        users.save(admin);
        return org;
    }

    @Transactional
    public void addMember(String username, String email) {
        var admin = requireAdmin(username);
        var member = users.findByEmail(email.trim().toLowerCase(java.util.Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No account exists for that email"));
        if (member.getId().equals(admin.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin is already a member");
        }
        if (member.getOrganisation() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "That account already belongs to an organisation");
        }
        member.setOrganisation(admin.getOrganisation());
        users.save(member);
    }

    @Transactional(readOnly = true)
    public OrganisationDashboardResponse dashboard(String username, LocalDate from, LocalDate to) {
        var admin = requireAdmin(username);
        validateRange(from, to);
        var org = admin.getOrganisation();
        var members = users.findAllByOrganisationId(org.getId());
        Map<String, BigDecimal> categories = new LinkedHashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        Map<YearMonth, BigDecimal> months = new java.util.TreeMap<>();
        List<OrganisationDashboardResponse.EmployeeTotal> employeeRows = new java.util.ArrayList<>();

        for (var member : members) {
            var rows = activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                    member.getId(), from, to);
            Map<String, BigDecimal> memberCategories = new LinkedHashMap<>();
            BigDecimal memberTotal = BigDecimal.ZERO;
            for (var row : rows) {
                BigDecimal value = row.getCo2eKg() == null ? BigDecimal.ZERO : row.getCo2eKg();
                memberTotal = memberTotal.add(value);
                categories.merge(row.getCategory(), value, BigDecimal::add);
                memberCategories.merge(row.getCategory(), value, BigDecimal::add);
                months.merge(YearMonth.from(row.getLogDate()), value, BigDecimal::add);
            }
            total = total.add(memberTotal);
            employeeRows.add(new OrganisationDashboardResponse.EmployeeTotal(
                    member.getUsername(), memberTotal, memberCategories));
        }
        employeeRows.sort(java.util.Comparator.comparing(
                OrganisationDashboardResponse.EmployeeTotal::totalCo2eKg));
        var trend = months.entrySet().stream().map(e ->
                new OrganisationDashboardResponse.MonthlyTotal(e.getKey().toString(), e.getValue())).toList();
        return new OrganisationDashboardResponse(org.getName(), from, to, total, categories, trend, employeeRows);
    }

    @Transactional(readOnly = true)
    public byte[] exportCsv(String username, LocalDate from, LocalDate to) {
        var data = dashboard(username, from, to);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(bytes, StandardCharsets.UTF_8))) {
            writer.println("Organisation,From,To,Employee,Total CO2e kg,Transport,Electricity,Food,Shopping");
            for (var employee : data.employees()) {
                writer.printf("%s,%s,%s,%s,%s,%s,%s,%s,%s%n",
                        csv(data.organisationName()), data.from(), data.to(), csv(employee.username()),
                        employee.totalCo2eKg(), employee.byCategory().getOrDefault("transport", BigDecimal.ZERO),
                        employee.byCategory().getOrDefault("electricity", BigDecimal.ZERO),
                        employee.byCategory().getOrDefault("food", BigDecimal.ZERO),
                        employee.byCategory().getOrDefault("shopping", BigDecimal.ZERO));
            }
        }
        return bytes.toByteArray();
    }

    private String csv(String value) { return """ + value.replace(""", """") + """; }
    private void validateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date range");
    }
    private com.CarbonTrack.backend.entity.User user(String username) {
        return users.findByUsername(username).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
    private com.CarbonTrack.backend.entity.User requireAdmin(String username) {
        var admin = user(username);
        if (!"ORG_ADMIN".equals(admin.getRole()) || admin.getOrganisation() == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Organisation administrator access is required");
        return admin;
    }
}
