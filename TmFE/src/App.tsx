import { useState, useEffect, useCallback } from 'react';
import { StoryPanel } from './components/StoryPanel';
import { AgentPanel } from './components/AgentPanel';
import {
  listStories,
  approveStory,
  updateStoryStatus,
  deleteStory,
  updateSubtaskStatus,
} from './services/api';
import type { Story, StoryStatus } from './types/todo';
import './App.css';

/** Generate or retrieve a persistent user id stored in localStorage. */
function getOrCreateUserId(): string {
  let id = localStorage.getItem('tm-user-id');
  if (!id) {
    id = 'user-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('tm-user-id', id);
  }
  return id;
}

/** Generate or retrieve a persistent agent thread id stored in localStorage. */
function getOrCreateThreadId(): string {
  let id = localStorage.getItem('tm-thread-id');
  if (!id) {
    id = 'thread-' + Math.random().toString(36).slice(2, 18);
    localStorage.setItem('tm-thread-id', id);
  }
  return id;
}

export default function App() {
  const [userId]   = useState(getOrCreateUserId);
  const [threadId] = useState(getOrCreateThreadId);

  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      setFetchError(null);
      // Fetch both approved and drafts so drafts appear in the Drafts tab
      const data = await listStories(userId, true);
      setStories(data);
    } catch (err) {
      setFetchError((err as Error).message);
    } finally {
      setStoriesLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const handleStatusChange = async (storyId: string, status: StoryStatus) => {
    try {
      const updated = await updateStoryStatus(storyId, status);
      setStories(prev => prev.map(s => s.id === storyId ? updated : s));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleApprove = async (storyId: string) => {
    try {
      const updated = await approveStory(storyId, true);
      setStories(prev => prev.map(s => s.id === storyId ? updated : s));
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleReject = async (storyId: string) => {
    try {
      await approveStory(storyId, false);
      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  const handleDelete = async (storyId: string) => {
    try {
      await deleteStory(storyId);
      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSubtaskToggle = async (
    storyId: string,
    subtaskId: string,
    status: StoryStatus
  ) => {
    try {
      const updated = await updateSubtaskStatus(storyId, subtaskId, status);
      setStories(prev => prev.map(s => s.id === storyId ? updated : s));
    } catch (err) {
      console.error('Subtask toggle failed:', err);
    }
  };

  return (
    <div className="app-root">
      {/* App-wide header */}
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-logo">✦</span>
          <span className="app-name">TM<span className="app-name-accent">Todo</span></span>
          <span className="app-powered">AI-powered stories</span>
        </div>
        <div className="app-header-right">
          <span className="user-badge">
            <span className="user-dot" />
            {userId}
          </span>
        </div>
      </header>

      {/* Main split layout */}
      <div className="app-body">
        {/* Left — story board */}
        <div className="panel-left">
          {fetchError && (
            <div className={`fetch-error ${fetchError.includes('serviceAccountKey') || fetchError.includes('service account') ? 'fetch-error-setup' : ''}`}>
              {fetchError.includes('serviceAccountKey') || fetchError.includes('service account') ? (
                <>
                  🔑 <strong>Firebase not configured.</strong> Download your service account key from{' '}
                  <em>Firebase Console → Project Settings → Service accounts → Generate new private key</em>{' '}
                  and save it as <code>TmBE/serviceAccountKey.json</code>.{' '}
                  <button onClick={fetchStories} className="retry-link">Retry</button>
                </>
              ) : (
                <>⚠️ {fetchError} — <button onClick={fetchStories} className="retry-link">Retry</button></>
              )}
            </div>
          )}
          <StoryPanel
            stories={stories}
            loading={storiesLoading}
            onStatusChange={handleStatusChange}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            onSubtaskToggle={handleSubtaskToggle}
          />
        </div>

        {/* Divider */}
        <div className="panel-divider" />
        {/* Right — AI assistant */}
        <div className="panel-right">
          <AgentPanel
            userId={userId}
            threadId={threadId}
            onRefresh={fetchStories}
          />
        </div>
      </div>
    </div>
  );
}


