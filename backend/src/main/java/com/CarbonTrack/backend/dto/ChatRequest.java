package com.CarbonTrack.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        @NotBlank(message = "Please enter a message")
        @Size(max = 500, message = "Messages must be 500 characters or fewer")
        String message) {
}
