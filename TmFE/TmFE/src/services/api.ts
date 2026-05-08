/**
 * API service for communicating with the TMLearning backend.
 * Supports SSE streaming with status updates for real-time Gemini AI responses.
 */

const API_BASE_URL = "http://127.0.0.1:8000";

export interface ChatResponse {
  response: string;
}

/** Possible activity statuses sent by the backend during streaming. */
export type StreamStatus = "thinking" | "web_searching" | "generating";

/**
 * Send a message and stream the response from Gemini AI via SSE.
 * @param message - The user's message to send.
 * @param onStatus - Callback invoked when the model's activity status changes.
 * @param onChunk - Callback invoked with each text chunk as it arrives.
 * @param onDone - Callback invoked when the stream completes.
 * @param onError - Callback invoked if an error occurs.
 */
export async function streamMessage(
  message: string,
  onStatus: (status: StreamStatus) => void,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    onError(error.detail || `Request failed with status ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("Failed to read response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE lines from the buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      const data = line.slice(6);
      if (data === "[DONE]") {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          onError(parsed.error);
          return;
        }
        if (parsed.status) {
          onStatus(parsed.status as StreamStatus);
        }
        if (parsed.content) {
          onChunk(parsed.content);
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }

  onDone();
}
