package com.CarbonTrack.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record OrganisationDashboardResponse(
        String organisationName,
        LocalDate from,
        LocalDate to,
        BigDecimal totalCo2eKg,
        Map<String, BigDecimal> byCategory,
        List<MonthlyTotal> monthTrend,
        List<EmployeeTotal> employees
) {
    public record MonthlyTotal(String month, BigDecimal totalCo2eKg) {}
    public record EmployeeTotal(String username, BigDecimal totalCo2eKg,
                                Map<String, BigDecimal> byCategory) {}
}
