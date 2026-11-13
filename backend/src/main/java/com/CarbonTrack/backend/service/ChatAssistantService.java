package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.ChatRequest;
import com.CarbonTrack.backend.dto.ChatResponse;
import com.CarbonTrack.backend.dto.ChatStatusResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatAssistantService {

    private final ChatService guidedAssistant;
    private final ChatContextService contextService;
    private final GeminiAssistantService gemini;

    public ChatAssistantService(
            ChatService guidedAssistant,
            ChatContextService contextService,
            GeminiAssistantService gemini) {
        this.guidedAssistant = guidedAssistant;
        this.contextService = contextService;
        this.gemini = gemini;
    }

    public ChatResponse reply(String username, ChatRequest request) {
        ChatResponse guided = guidedAssistant.reply(username, request.message());
        if (!request.useAi() || !gemini.isConfigured()) return guided;

        try {
            String context = contextService.buildContext(username);
            List<ChatRequest.ChatTurn> history = request.history() == null
                    ? List.of() : request.history();
            var generated = gemini.generate(request.message(), context, history);
            if (generated.isPresent()) {
                return new ChatResponse(
                        generated.get(),
                        guided.suggestions(),
                        guided.dataWindow(),
                        true,
                        "GEMINI",
                        gemini.model());
            }
        } catch (RuntimeException ex) {
            // Keep the local, data-backed guide available when context or inference is unavailable.
        }
        return guided;
    }

    public ChatStatusResponse status() {
        return new ChatStatusResponse(gemini.isConfigured(), "Google Gemini", gemini.model());
    }
}
