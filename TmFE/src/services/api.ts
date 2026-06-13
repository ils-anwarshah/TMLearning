/**
 * API service for TMLearning backend.
 * Covers:
 *   - Gemini chat streaming  (/chat/stream)
 *   - ToDo story CRUD        (/todo/*)
 *   - LangChain agent SSE    (/todo/agent/stream)
 */

import type { Story, StoryStatus } from '../types/todo';

const API_BASE = 'http://127.0.0.1:8000';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Gemini Chat streaming (existing — kept for compatibility)
// ---------------------------------------------------------------------------

export type StreamStatus = 'thinking' | 'web_searching' | 'generating';

export async function streamMessage(
  message: string,
  onStatus: (status: StreamStatus) => void,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    onError(error.detail ?? `Request failed with status ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) { onError('Failed to read response stream'); return; }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(data);
        if (parsed.error)   { onError(parsed.error); return; }
        if (parsed.status)  onStatus(parsed.status as StreamStatus);
        if (parsed.content) onChunk(parsed.content);
      } catch { /* ignore malformed lines */ }
    }
  }
  onDone();
}

// ---------------------------------------------------------------------------
// ToDo Story CRUD
// ---------------------------------------------------------------------------

export function listStories(userId: string, includeDrafts = false): Promise<Story[]> {
  const qs = new URLSearchParams({ user_id: userId });
  if (includeDrafts) qs.set('include_drafts', 'true');
  return request<Story[]>(`/todo/?${qs}`);
}

export function approveStory(storyId: string, approved: boolean): Promise<Story> {
  return request<Story>(`/todo/${storyId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approved }),
  });
}

export function updateStoryStatus(storyId: string, status: StoryStatus): Promise<Story> {
  return request<Story>(`/todo/${storyId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteStory(storyId: string): Promise<void> {
  return request<void>(`/todo/${storyId}`, { method: 'DELETE' });
}

export function updateSubtaskStatus(
  storyId: string,
  subtaskId: string,
  status: StoryStatus
): Promise<Story> {
  return request<Story>(`/todo/${storyId}/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------------------------------------------------
// LangChain Agent SSE streaming
// ---------------------------------------------------------------------------

export type AgentEventType =
  | { type: 'message'; content: string }
  | { type: 'tool_call'; tool: string }
  | { type: 'story'; data: Story }
  | { type: 'done' }
  | { type: 'error'; detail: string };

export async function streamAgentMessage(
  prompt: string,
  userId: string,
  threadId: string,
  onEvent: (event: AgentEventType) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/todo/agent/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, user_id: userId, thread_id: threadId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    onEvent({ type: 'error', detail: err.detail ?? `HTTP ${res.status}` });
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onEvent({ type: 'error', detail: 'Failed to read agent stream' });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const parsed = JSON.parse(line.slice(6)) as AgentEventType;
        onEvent(parsed);
        if (parsed.type === 'done' || parsed.type === 'error') return;
      } catch { /* ignore malformed lines */ }
    }
  }
  onEvent({ type: 'done' });
}


