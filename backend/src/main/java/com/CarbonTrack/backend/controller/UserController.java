
package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.UpdateUserProfileRequest;
import com.CarbonTrack.backend.dto.UserProfileResponse;
import com.CarbonTrack.backend.entity.User;
import com.CarbonTrack.backend.repository.UserRepository;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(
            @AuthenticationPrincipal Jwt jwt) {

        User user = getAuthenticatedUser(jwt);
        return toProfileResponse(user);
    }

    @PutMapping("/me")
    @Transactional
    public UserProfileResponse updateMyProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateUserProfileRequest request) {

        User user = getAuthenticatedUser(jwt);

        user.setPreferredTransport(request.preferredTransport());
        user.setDietPreference(request.dietPreference());
        user.setSustainabilityGoal(request.sustainabilityGoal());
        if (request.preferredUnits() != null) {
            user.setPreferredUnits(request.preferredUnits().toLowerCase(java.util.Locale.ROOT));
        }
        if (request.goalVisibility() != null) {
            user.setGoalVisibility(request.goalVisibility());
        }

        User savedUser = userRepository.save(user);
        return toProfileResponse(savedUser);
    }

    private User getAuthenticatedUser(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required"
            );
        }

        return userRepository.findByUsername(jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user was not found"
                ));
    }

    private UserProfileResponse toProfileResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.getPreferredTransport(),
                user.getDietPreference(),
                user.getSustainabilityGoal(),
                user.getPreferredUnits(),
                user.isGoalVisibility()
        );
    }
}
