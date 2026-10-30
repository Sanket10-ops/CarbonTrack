package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.RecommendationResponse;
import com.CarbonTrack.backend.service.RecommendationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService service;
    public RecommendationController(RecommendationService service) { this.service = service; }
    @GetMapping
    public List<RecommendationResponse> get(@AuthenticationPrincipal Jwt jwt) {
        return service.recommendations(jwt.getSubject());
    }
}