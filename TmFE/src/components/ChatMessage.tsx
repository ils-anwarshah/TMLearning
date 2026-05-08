import "./ChatMessage.css";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

/**
 * Renders a single chat message bubble.
 */
export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`chat-message ${role}`}>
      <div className="message-label">{role === "user" ? "You" : "Gemini AI"}</div>
      <div className="message-bubble">{content}</div>
    </div>
  );
}
