package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.AuthResponse;
import com.CarbonTrack.backend.dto.ChangePasswordRequest;
import com.CarbonTrack.backend.dto.LoginRequest;
import com.CarbonTrack.backend.dto.RegisterRequest;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Register a new user
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {

        User user = authService.register(request);

        return new AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }

    // Login an existing user
    @PostMapping("/login")
    public TokenResponse login(
            @Valid @RequestBody LoginRequest request) {

        String token = authService.login(request);

        return new TokenResponse(token, "Bearer");
    }

    // Change password for the authenticated user
    @PatchMapping("/change-password")
    public Map<String, String> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChangePasswordRequest request) {

        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required"
            );
        }

        authService.changePassword(jwt.getSubject(), request);

        return Map.of(
                "message",
                "Password changed successfully"
        );
    }

    // Login response
    public record TokenResponse(
            String accessToken,
            String tokenType) {
    }
}
