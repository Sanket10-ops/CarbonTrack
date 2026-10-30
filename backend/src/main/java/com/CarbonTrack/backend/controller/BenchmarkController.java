package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.BenchmarkResponse;
import com.CarbonTrack.backend.service.BenchmarkService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics/benchmark")
public class BenchmarkController {
    private final BenchmarkService service;
    public BenchmarkController(BenchmarkService service) { this.service=service; }
    @GetMapping
    public BenchmarkResponse get(@AuthenticationPrincipal Jwt jwt,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return service.benchmark(jwt.getSubject(),startDate,endDate);
    }
}