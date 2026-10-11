
package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.AuthResponse;
import com.CarbonTrack.backend.dto.LoginRequest;
import com.CarbonTrack.backend.dto.RegisterRequest;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

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

    @PostMapping("/login")
    public TokenResponse login(
            @Valid @RequestBody LoginRequest request) {

        String token = authService.login(request);
        return new TokenResponse(token, "Bearer");
    }

    public record TokenResponse(String accessToken, String tokenType) {
    }
}
