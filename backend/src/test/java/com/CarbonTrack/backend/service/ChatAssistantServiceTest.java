package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.ChatRequest;
import com.CarbonTrack.backend.dto.ChatResponse;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ChatAssistantServiceTest {

    @Test
    void keepsGuidedModeLocalWhenAiIsNotRequested() {
        ChatService guided = mock(ChatService.class);
        ChatContextService context = mock(ChatContextService.class);
        GeminiAssistantService gemini = mock(GeminiAssistantService.class);
        ChatResponse expected = guidedResponse();
        when(guided.reply("ravi", "How can I reduce my footprint?")).thenReturn(expected);

        ChatAssistantService service = new ChatAssistantService(guided, context, gemini);
        ChatResponse actual = service.reply(
                "ravi",
                new ChatRequest("How can I reduce my footprint?", List.of(), false));

        assertSame(expected, actual);
        assertFalse(actual.aiPowered());
        verify(guided).reply("ravi", "How can I reduce my footprint?");
        verifyNoInteractions(context, gemini);
    }

    @Test
    void returnsGeminiAnswerAndRetainsGuidedSuggestionsWhenAiSucceeds() {
        ChatService guided = mock(ChatService.class);
        ChatContextService context = mock(ChatContextService.class);
        GeminiAssistantService gemini = mock(GeminiAssistantService.class);
        ChatResponse guidedReply = guidedResponse();
        List<ChatRequest.ChatTurn> history = List.of(
                new ChatRequest.ChatTurn("user", "Earlier question"),
                new ChatRequest.ChatTurn("assistant", "Earlier answer"));

        when(guided.reply("ravi", "What should I focus on?")).thenReturn(guidedReply);
        when(gemini.isConfigured()).thenReturn(true);
        when(context.buildContext("ravi")).thenReturn("aggregated account summary");
        when(gemini.generate(
                "What should I focus on?", "aggregated account summary", history))
                .thenReturn(Optional.of("Focus on the largest recorded category."));
        when(gemini.model()).thenReturn("gemini-3.8-flash");

        ChatAssistantService service = new ChatAssistantService(guided, context, gemini);
        ChatResponse actual = service.reply(
                "ravi",
                new ChatRequest("What should I focus on?", history, true));

        assertEquals("Focus on the largest recorded category.", actual.reply());
        assertEquals(guidedReply.suggestions(), actual.suggestions());
        assertEquals(guidedReply.dataWindow(), actual.dataWindow());
        assertTrue(actual.aiPowered());
        assertEquals("GEMINI", actual.assistantMode());
        assertEquals("gemini-3.8-flash", actual.model());
        verify(gemini).generate(
                "What should I focus on?", "aggregated account summary", history);
    }

    @Test
    void fallsBackToGuidedAnswerWhenGeminiReturnsNoText() {
        ChatService guided = mock(ChatService.class);
        ChatContextService context = mock(ChatContextService.class);
        GeminiAssistantService gemini = mock(GeminiAssistantService.class);
        ChatResponse expected = guidedResponse();

        when(guided.reply("ravi", "Summarise my activity")).thenReturn(expected);
        when(gemini.isConfigured()).thenReturn(true);
        when(context.buildContext("ravi")).thenReturn("aggregated account summary");
        when(gemini.generate(
                "Summarise my activity", "aggregated account summary", List.of()))
                .thenReturn(Optional.empty());

        ChatAssistantService service = new ChatAssistantService(guided, context, gemini);
        ChatResponse actual = service.reply(
                "ravi", new ChatRequest("Summarise my activity", List.of(), true));

        assertSame(expected, actual);
        assertFalse(actual.aiPowered());
    }

    @Test
    void fallsBackToGuidedAnswerWhenAccountContextCannotBeBuilt() {
        ChatService guided = mock(ChatService.class);
        ChatContextService context = mock(ChatContextService.class);
        GeminiAssistantService gemini = mock(GeminiAssistantService.class);
        ChatResponse expected = guidedResponse();

        when(guided.reply("ravi", "What is my progress?")).thenReturn(expected);
        when(gemini.isConfigured()).thenReturn(true);
        when(context.buildContext("ravi"))
                .thenThrow(new IllegalStateException("Context unavailable"));

        ChatAssistantService service = new ChatAssistantService(guided, context, gemini);
        ChatResponse actual = service.reply(
                "ravi", new ChatRequest("What is my progress?", List.of(), true));

        assertSame(expected, actual);
        assertFalse(actual.aiPowered());
    }

    private ChatResponse guidedResponse() {
        return new ChatResponse(
                "Guided answer",
                List.of("Review your dashboard"),
                "Last 30 days");
    }
}
