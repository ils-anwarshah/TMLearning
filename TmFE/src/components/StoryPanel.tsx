import { useState } from 'react';
import type { Story, StoryStatus } from '../types/todo';
import { StoryCard } from './StoryCard';
import './StoryPanel.css';

type Filter = 'ALL' | StoryStatus | 'DRAFTS';

interface StoryPanelProps {
  stories: Story[];
  loading: boolean;
  onStatusChange: (storyId: string, status: StoryStatus) => void;
  onApprove: (storyId: string) => void;
  onReject: (storyId: string) => void;
  onDelete: (storyId: string) => void;
  onSubtaskToggle: (storyId: string, subtaskId: string, status: StoryStatus) => void;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFTS', label: 'Drafts' },
  { key: 'TODO', label: 'Todo' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'COMPLETED', label: 'Done' },
];

function applyFilter(stories: Story[], filter: Filter): Story[] {
  if (filter === 'ALL')    return stories.filter(s => s.approved !== null);
  if (filter === 'DRAFTS') return stories.filter(s => s.approved === null);
  return stories.filter(s => s.approved !== null && s.status === filter);
}

function countByFilter(stories: Story[], filter: Filter): number {
  return applyFilter(stories, filter).length;
}

export function StoryPanel({
  stories,
  loading,
  onStatusChange,
  onApprove,
  onReject,
  onDelete,
  onSubtaskToggle,
}: StoryPanelProps) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const filtered = applyFilter(stories, filter);

  return (
    <div className="story-panel">
      {/* Panel header */}
      <div className="panel-header">
        <div className="panel-title-row">
          <span className="panel-icon">🗂️</span>
          <h2 className="panel-title">Stories</h2>
          <span className="story-total-count">{stories.filter(s => s.approved !== null).length}</span>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {FILTERS.map(({ key, label }) => {
            const count = countByFilter(stories, key);
            return (
              <button
                key={key}
                className={`filter-tab ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                {count > 0 && <span className="filter-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Story list */}
      <div className="story-list">
        {loading ? (
          <div className="story-skeleton-list">
            {[1, 2, 3].map(i => (
              <div key={i} className="story-skeleton">
                <div className="skeleton-bar short" />
                <div className="skeleton-bar" />
                <div className="skeleton-bar medium" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="stories-empty">
            <div className="stories-empty-icon">
              {filter === 'DRAFTS' ? '📋' : filter === 'COMPLETED' ? '🎉' : '📭'}
            </div>
            <p className="stories-empty-title">
              {filter === 'ALL' ? 'No stories yet' :
               filter === 'DRAFTS' ? 'No pending drafts' :
               `No ${filter.toLowerCase()} stories`}
            </p>
            <p className="stories-empty-hint">
              {filter === 'ALL'
                ? 'Use the chat on the right to ask the AI to create a story.'
                : 'Switch to another filter or ask the AI to create one.'}
            </p>
          </div>
        ) : (
          filtered.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              onStatusChange={onStatusChange}
              onApprove={onApprove}
              onReject={onReject}
              onDelete={onDelete}
              onSubtaskToggle={onSubtaskToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
