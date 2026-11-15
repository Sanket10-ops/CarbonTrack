package com.CarbonTrack.backend.dto;

import java.util.List;

public record ChatResponse(
        String reply,
        List<String> suggestions,
        String dataWindow,
        boolean aiPowered,
        String assistantMode,
        String model) {

    public ChatResponse(String reply, List<String> suggestions, String dataWindow) {
        this(reply, suggestions, dataWindow, false, "GUIDED", null);
    }
}
