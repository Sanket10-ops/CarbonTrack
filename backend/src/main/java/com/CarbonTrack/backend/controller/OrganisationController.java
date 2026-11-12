package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.OrganisationCreateRequest;
import com.CarbonTrack.backend.dto.OrganisationDashboardResponse;
import com.CarbonTrack.backend.dto.OrganisationMemberRequest;
import com.CarbonTrack.backend.service.OrganisationService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/organisations")
public class OrganisationController {
    private final OrganisationService service;
    public OrganisationController(OrganisationService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@AuthenticationPrincipal Jwt jwt,
                                      @Valid @RequestBody OrganisationCreateRequest request) {
        var org = service.create(jwt.getSubject(), request.name());
        return Map.of("id", org.getId(), "name", org.getName(), "role", "ORG_ADMIN");
    }

    @PostMapping("/me/members")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> addMember(@AuthenticationPrincipal Jwt jwt,
                                         @Valid @RequestBody OrganisationMemberRequest request) {
        service.addMember(jwt.getSubject(), request.email());
        return Map.of("message", "Member added");
    }

    @GetMapping("/me/dashboard")
    public OrganisationDashboardResponse dashboard(@AuthenticationPrincipal Jwt jwt,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.dashboard(jwt.getSubject(), from, to);
    }

    @GetMapping("/me/export.csv")
    public ResponseEntity<byte[]> export(@AuthenticationPrincipal Jwt jwt,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] body = service.exportCsv(jwt.getSubject(), from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=carbontrack-organisation-report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }
}
