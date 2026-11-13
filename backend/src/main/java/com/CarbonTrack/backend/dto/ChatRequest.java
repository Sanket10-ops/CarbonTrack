package com.CarbonTrack.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChatRequest(
        @NotBlank(message = "Please enter a message")
        @Size(max = 500, message = "Messages must be 500 characters or fewer")
        String message,
        @Size(max = 8, message = "Only the most recent 8 chat turns can be sent")
        List<@Valid ChatTurn> history,
        boolean useAi) {

    public ChatRequest {
        history = history == null ? List.of() : List.copyOf(history);
    }

    public record ChatTurn(
            @NotBlank
            @Pattern(regexp = "user|assistant", message = "Chat role must be user or assistant")
            String role,
            @NotBlank
            @Size(max = 1000, message = "A chat turn must be 1000 characters or fewer")
            String content) {
    }
}
