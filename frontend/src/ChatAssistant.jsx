import React, { useEffect, useRef, useState } from "react";
import { api } from "./api.js";

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Hi! I’m Eco Assistant. I can explain your CarbonTrack footprint, explore your category trends, review your goals and help plan realistic reductions. Turn on Gemini AI for more natural, context-aware conversations.",
  suggestions: [
    "Summarise my carbon footprint",
    "Which category is highest?",
    "How are my goals progressing?"
  ]
};

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [chatStatus, setChatStatus] = useState({ configured: false, provider: "Google Gemini", model: "gemini-3.8-flash" });
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.chatStatus()
      .then((status) => {
        if (alive) setChatStatus(status);
      })
      .catch(() => {
        if (alive) setChatStatus({ configured: false, provider: "Google Gemini", model: "gemini-3.8-flash" });
      })
      .finally(() => {
        if (alive) setStatusLoaded(true);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage(value = draft) {
    const message = value.trim();
    if (!message || busy) return;

    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setDraft("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    setBusy(true);

    try {
      const result = await api.chat(message, history, useAi && chatStatus.configured);
      setMessages((current) => [...current, {
        role: "assistant",
        content: result.reply || "I could not create a response. Please try another question.",
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
        aiPowered: Boolean(result.aiPowered),
        assistantMode: result.assistantMode || "GUIDED",
        model: result.model || null
      }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        content: error.message || "The assistant could not reach CarbonTrack. Please try again."
      }]);
    } finally {
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return <>
    <button
      type="button"
      className="chat-assistant-launcher"
      aria-label={open ? "Close sustainability assistant" : "Open sustainability assistant"}
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
    >
      <span>{open ? "×" : "✳"}</span>{open ? "Close assistant" : "Ask Eco Assistant"}
    </button>

    {open && <section className="chat-assistant-panel" role="dialog" aria-label="CarbonTrack AI sustainability assistant">
      <header className="chat-assistant-header">
        <div className="chat-assistant-mark">✳</div>
        <div className="chat-assistant-heading">
          <b>Eco Assistant</b>
          <small>Personal sustainability intelligence</small>
        </div>
        <span className={"chat-assistant-status " + (useAi && chatStatus.configured ? "ai" : "guided")}>
          {useAi && chatStatus.configured ? "AI MODE" : "GUIDED"}
        </span>
        <button type="button" className="chat-assistant-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
      </header>

      <div className="chat-assistant-ai-controls">
        <label className={"chat-ai-toggle " + (!chatStatus.configured ? "unavailable" : "")}>
          <input
            type="checkbox"
            checked={useAi}
            disabled={!chatStatus.configured || !statusLoaded || busy}
            onChange={(event) => setUseAi(event.target.checked)}
          />
          <span className="chat-ai-switch" aria-hidden="true" />
          <span className="chat-ai-toggle-copy">
            <b>Use Gemini AI</b>
            <small>{chatStatus.configured
              ? (useAi ? "AI is enabled for your next reply" : "Enable richer, context-aware answers")
              : "AI key not configured on the backend"}</small>
          </span>
        </label>
        <div className="chat-assistant-disclosure">
          {useAi && chatStatus.configured
            ? "AI mode sends your last-30-day aggregated footprint, goal summary and up to 8 recent chat turns to Google Gemini. Account name, email and raw activity rows are excluded; provider-side interaction storage is disabled."
            : "Guided mode uses CarbonTrack records and built-in sustainability guidance. Your data stays within the CarbonTrack backend."}
        </div>
      </div>

      <div className="chat-assistant-messages" ref={listRef} aria-live="polite">
        {messages.map((message, index) => (
          <div className={"chat-message " + message.role} key={index}>
            {message.role === "assistant" && index > 0 && (
              <span className={"chat-message-mode " + (message.aiPowered ? "ai" : "guided")}>
                {message.aiPowered ? "GEMINI · " + (message.model || chatStatus.model) : "CARBONTRACK GUIDE"}
              </span>
            )}
            <div className="chat-message-bubble">{message.content}</div>
            {message.role === "assistant" && message.suggestions?.length > 0 && (
              <div className="chat-message-suggestions">
                {message.suggestions.map((suggestion) => (
                  <button type="button" key={suggestion} disabled={busy} onClick={() => sendMessage(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="chat-assistant-typing" role="status">{useAi ? "Gemini is thinking…" : "Eco Assistant is preparing a response…"}</div>}
      </div>

      <form className="chat-assistant-compose" onSubmit={submit}>
        <textarea
          ref={inputRef}
          rows={2}
          maxLength={500}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your footprint, goals or next steps…"
          aria-label="Message Eco Assistant"
          disabled={busy}
        />
        <button type="submit" className="chat-assistant-send" disabled={busy || !draft.trim()} aria-label="Send message">
          ➤
        </button>
      </form>
    </section>}
  </>;
}
