package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.dto.ChatRequest;
import com.CarbonTrack.backend.dto.ChatResponse;
import com.CarbonTrack.backend.dto.ChatStatusResponse;
import com.CarbonTrack.backend.service.ChatAssistantService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatAssistantService assistant;

    public ChatController(ChatAssistantService assistant) {
        this.assistant = assistant;
    }

    @GetMapping("/status")
    public ChatStatusResponse status(@AuthenticationPrincipal Jwt jwt) {
        return assistant.status();
    }

    @PostMapping("/message")
    public ChatResponse send(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChatRequest request) {
        return assistant.reply(jwt.getSubject(), request);
    }
}
