
package com.CarbonTrack.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 100,
                message = "Username must be between 3 and 100 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_.-]+$",
                message = "Username can contain letters, numbers, dots, underscores, and hyphens")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72,
                message = "Password must be between 8 and 72 characters")
        String password
) {
}
