import { useState, useRef, useEffect } from 'react';
import type { ChatEntry, Story } from '../types/todo';
import { streamMessage } from '../services/api';
import type { StreamStatus } from '../services/api';
import './AgentPanel.css';

interface AgentPanelProps {
  userId: string;
  threadId: string;
  onRefresh: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  create_story_draft:   'Creating story draft',
  add_subtask_to_story: 'Adding subtask',
  list_stories:         'Fetching stories',
  get_story_details:    'Reading story',
  update_story_fields:  'Updating story',
  approve_story_draft:  'Approving draft',
  delete_story_by_id:   'Deleting story',
  update_subtask_status:'Updating subtask',
  remove_subtask:       'Removing subtask',
};

function uid(): string {
  return Math.random().toString(36).slice(2);
}

function StoryPreview({ story }: { story: Story }) {
  const done = story.subtasks.filter(s => s.status === 'COMPLETED').length;
  return (
    <div className="chat-story-preview">
      <div className="chat-story-header">
        <span className={`chat-story-priority priority-${story.priority}`}>
          {story.priority.toUpperCase()}
        </span>
        <span className={`chat-story-status status-${story.status.toLowerCase()}`}>
          {story.approved === null ? 'DRAFT' : story.status}
        </span>
      </div>
      <p className="chat-story-title">{story.title}</p>
      {story.subtasks.length > 0 && (
        <p className="chat-story-meta">{done}/{story.subtasks.length} subtasks</p>
      )}
      {story.approved === null && (
        <p className="chat-story-hint">💡 Use Approve/Reject on the left panel to confirm.</p>
      )}
    </div>
  );
}

export function AgentPanel({ userId, threadId, onRefresh }: AgentPanelProps) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || streaming) return;
    setInput('');
    setStreaming(true);

    const userEntry: ChatEntry = { id: uid(), kind: 'user', text: prompt };
    const agentId = uid();
    const agentEntry: ChatEntry = { id: agentId, kind: 'agent', text: '', tools: [], loading: true };

    setEntries(prev => [...prev, userEntry, agentEntry]);

    await streamMessage(
      prompt,
      (s) => setStreamStatus(s),
      (chunk) => setEntries(prev =>
        prev.map(e =>
          e.id === agentId && e.kind === 'agent'
            ? { ...e, text: e.text + chunk, loading: false }
            : e
        )
      ),
      () => { setStreaming(false); setStreamStatus(null); },
      (error) => {
        const errEntry: ChatEntry = { id: uid(), kind: 'error', text: error };
        setEntries(prev => [...prev.filter(e => e.id !== agentId), errEntry]);
        setStreaming(false);
        setStreamStatus(null);
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="agent-panel">
      {/* Header */}
      <div className="agent-header">
        <div className="agent-header-left">
          <span className="agent-icon">✦</span>
          <div>
            <h2 className="agent-title">AI Assistant</h2>
            <p className="agent-subtitle">LangChain · Gemini 2.5 Flash</p>
          </div>
        </div>
        <div className="agent-thread-info">
          <span className="agent-thread-dot" />
          <span className="agent-thread-label">live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="agent-messages">
        {entries.length === 0 && (
          <div className="agent-welcome">
            <div className="agent-welcome-icon">✦</div>
            <p className="agent-welcome-title">Ask me anything about your tasks</p>
            <div className="agent-suggestions">
              {[
                'Create a story for user authentication with OAuth',
                'Add a subtask for writing tests',
                'Show all my pending stories',
                'Mark the first story as completed',
              ].map(s => (
                <button key={s} className="agent-suggestion" onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {entries.map(entry => {
          if (entry.kind === 'user') {
            return (
              <div key={entry.id} className="chat-entry user-entry">
                <div className="chat-bubble user-bubble">{entry.text}</div>
              </div>
            );
          }

          if (entry.kind === 'agent') {
            return (
              <div key={entry.id} className="chat-entry agent-entry">
                {/* Tool call badges */}
                {entry.tools.length > 0 && (
                  <div className="tool-badges">
                    {entry.tools.map((tool, i) => (
                      <span key={i} className="tool-badge">
                        ⚡ {TOOL_LABELS[tool] ?? tool}
                      </span>
                    ))}
                  </div>
                )}
                {/* Agent bubble */}
                <div className={`chat-bubble agent-bubble ${entry.loading && !entry.text ? 'loading' : ''}`}>
                  {entry.loading && !entry.text ? (
                    <div className="agent-typing">
                      {streamStatus === 'thinking' && <span className="agent-status-text">Thinking…</span>}
                      {streamStatus === 'web_searching' && <span className="agent-status-text">Searching the web…</span>}
                      {(streamStatus === 'generating' || !streamStatus) && <><span /><span /><span /></>}
                    </div>
                  ) : (
                    <span>{entry.text}</span>
                  )}
                </div>
              </div>
            );
          }

          if (entry.kind === 'story') {
            return (
              <div key={entry.id} className="chat-entry">
                <StoryPreview story={entry.story} />
              </div>
            );
          }

          if (entry.kind === 'error') {
            return (
              <div key={entry.id} className="chat-entry">
                <div className="chat-bubble error-bubble">⚠️ {entry.text}</div>
              </div>
            );
          }

          return null;
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="agent-input-area">
        <textarea
          className="agent-textarea"
          placeholder="Ask me to create, edit, or manage your tasks…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
          rows={2}
        />
        <button
          className="agent-send-btn"
          onClick={handleSend}
          disabled={streaming || !input.trim()}
        >
          {streaming ? (
            <span className="send-spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
