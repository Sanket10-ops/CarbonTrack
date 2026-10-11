
package com.CarbonTrack.backend.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserProfileRequest(

        @Size(max = 50, message = "Preferred transport must not exceed 50 characters")
        String preferredTransport,

        @Size(max = 50, message = "Diet preference must not exceed 50 characters")
        String dietPreference,

        @Size(max = 100, message = "Sustainability goal must not exceed 100 characters")
        String sustainabilityGoal

) {
}
