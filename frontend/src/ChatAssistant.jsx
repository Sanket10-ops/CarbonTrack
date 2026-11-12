import React, { useEffect, useRef, useState } from "react";
import { api } from "./api.js";

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Hi! I’m your CarbonTrack guide. Ask me about your recent footprint, a category, your reduction goal, or practical ways to lower your impact.",
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
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage(value = draft) {
    const message = value.trim();
    if (!message || busy) return;

    setDraft("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    setBusy(true);

    try {
      const result = await api.chat(message);
      setMessages((current) => [...current, {
        role: "assistant",
        content: result.reply || "I could not create a response. Please try another question.",
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
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

    {open && <section className="chat-assistant-panel" role="dialog" aria-label="CarbonTrack sustainability assistant">
      <header className="chat-assistant-header">
        <div className="chat-assistant-mark">✳</div>
        <div className="chat-assistant-heading">
          <b>Eco Assistant</b>
          <small>CarbonTrack personal sustainability guide</small>
        </div>
        <button type="button" className="chat-assistant-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
      </header>

      <div className="chat-assistant-disclosure">
        Replies use your signed-in CarbonTrack records and built-in guidance. This is a guided, rule-based assistant, not a generative AI model.
      </div>

      <div className="chat-assistant-messages" ref={listRef} aria-live="polite">
        {messages.map((message, index) => (
          <div className={"chat-message " + message.role} key={index}>
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
        {busy && <div className="chat-assistant-typing" role="status">Eco Assistant is preparing a response…</div>}
      </div>

      <form className="chat-assistant-compose" onSubmit={submit}>
        <textarea
          ref={inputRef}
          rows={2}
          maxLength={500}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your footprint or goals…"
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
