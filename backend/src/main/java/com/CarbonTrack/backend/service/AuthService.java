package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.ChangePasswordRequest;
import com.CarbonTrack.backend.dto.LoginRequest;
import com.CarbonTrack.backend.dto.RegisterRequest;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // Register a new user
    @Transactional
    public User register(RegisterRequest request) {

        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException(
                    "Username is already taken");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException(
                    "Email is already registered");
        }

        User user = new User(
                username,
                email,
                passwordEncoder.encode(request.password()),
                "USER"
        );

        return userRepository.save(user);
    }

    // Login an existing user
    @Transactional(readOnly = true)
    public String login(LoginRequest request) {

        User user = userRepository
                .findByUsername(request.username().trim())
                .orElseThrow(() -> new BadCredentialsException(
                        "Invalid username or password"));

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash())) {

            throw new BadCredentialsException(
                    "Invalid username or password");
        }

        return jwtService.generateToken(
                user.getUsername(),
                user.getRole());
    }

    // Change password for an authenticated user
    @Transactional
    public void changePassword(
            String username,
            ChangePasswordRequest request) {

        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user was not found"));

        // Verify the current password
        if (!passwordEncoder.matches(
                request.currentPassword(),
                user.getPasswordHash())) {

            throw new BadCredentialsException(
                    "Current password is incorrect");
        }

        // Prevent reusing the current password
        if (passwordEncoder.matches(
                request.newPassword(),
                user.getPasswordHash())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password must be different from the current password");
        }

        // Encode and save the new password
        user.setPasswordHash(
                passwordEncoder.encode(request.newPassword()));

        userRepository.save(user);
    }
}
