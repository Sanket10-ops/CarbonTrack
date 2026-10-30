package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.BadgeResponse;
import com.CarbonTrack.backend.service.BadgeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {
    private final BadgeService service;
    public BadgeController(BadgeService service) { this.service=service; }
    @GetMapping
    public List<BadgeResponse> get(@AuthenticationPrincipal Jwt jwt) {
        return service.evaluateAndList(jwt.getSubject());
    }
}