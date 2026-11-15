package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.LeaderboardEntryResponse;
import com.CarbonTrack.backend.service.LeaderboardService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {
    private final LeaderboardService service;
    public LeaderboardController(LeaderboardService service) { this.service = service; }

    @GetMapping
    public List<LeaderboardEntryResponse> list(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "50") int limit) {
        return service.getLeaderboard(from, to, limit);
    }
}
