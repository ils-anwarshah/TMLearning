import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { streamMessage, type StreamStatus } from "./services/api";
import "./App.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/** Map backend status keys to user-friendly labels. */
const STATUS_LABELS: Record<StreamStatus, string> = {
  thinking: "Thinking...",
  web_searching: "Searching the web...",
  generating: "Generating response...",
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or status change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const handleSend = async (message: string) => {
    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setStatus("thinking");

    let assistantAdded = false;

    await streamMessage(
      message,
      (newStatus) => {
        setStatus(newStatus);
      },
      (chunk) => {
        if (!assistantAdded) {
          // Add the assistant message on first content chunk
          assistantAdded = true;
          setStatus(null);
          setMessages((prev) => [...prev, { role: "assistant", content: chunk }]);
        } else {
          // Append subsequent chunks to the last message
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
            return updated;
          });
        }
      },
      () => {
        setLoading(false);
        setStatus(null);
      },
      (error) => {
        setStatus(null);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${error}` },
        ]);
        setLoading(false);
      }
    );
  };

  return (
    <div className="chat-app">
      <header className="chat-header">
        <h1>TMLearning Chat</h1>
        <p>Powered by Gemini AI</p>
      </header>

      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            <p>Send a message to start chatting with Gemini AI</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && status && (
          <div className="chat-message assistant">
            <div className="message-label">Gemini AI</div>
            <div className="status-indicator">
              <span className="status-dot" />
              <span className="status-text">{STATUS_LABELS[status]}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}

export default App
