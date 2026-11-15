package com.CarbonTrack.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record OrganisationMemberRequest(
        @NotBlank @Email String email
) {}
