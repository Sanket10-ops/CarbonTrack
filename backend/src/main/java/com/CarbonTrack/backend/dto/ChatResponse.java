package com.CarbonTrack.backend.dto;

import java.util.List;

public record ChatResponse(
        String reply,
        List<String> suggestions,
        String dataWindow) {
}
