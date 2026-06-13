import type { Story, StoryStatus } from '../types/todo';
import './StoryCard.css';

interface StoryCardProps {
  story: Story;
  onStatusChange: (storyId: string, status: StoryStatus) => void;
  onApprove: (storyId: string) => void;
  onReject: (storyId: string) => void;
  onDelete: (storyId: string) => void;
  onSubtaskToggle: (storyId: string, subtaskId: string, status: StoryStatus) => void;
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

const STATUS_NEXT: Record<StoryStatus, StoryStatus | null> = {
  TODO: 'PENDING',
  PENDING: 'COMPLETED',
  COMPLETED: null,
};

const STATUS_PREV: Record<StoryStatus, StoryStatus | null> = {
  TODO: null,
  PENDING: 'TODO',
  COMPLETED: 'PENDING',
};

export function StoryCard({
  story,
  onStatusChange,
  onApprove,
  onReject,
  onDelete,
  onSubtaskToggle,
}: StoryCardProps) {
  const isDraft = story.approved === null;
  const completedCount = story.subtasks.filter((s) => s.status === 'COMPLETED').length;
  const totalCount = story.subtasks.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={`story-card priority-${story.priority} ${isDraft ? 'draft' : ''}`}>
      {/* Card header */}
      <div className="story-card-header">
        <div className="story-card-badges">
          <span className={`priority-badge priority-${story.priority}`}>
            {PRIORITY_LABEL[story.priority]}
          </span>
          {isDraft ? (
            <span className="status-badge draft">Draft</span>
          ) : (
            <span className={`status-badge status-${story.status.toLowerCase()}`}>
              {story.status}
            </span>
          )}
        </div>
        <button
          className="story-delete-btn"
          onClick={() => onDelete(story.id)}
          title="Delete story"
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <h3 className="story-title">{story.title}</h3>

      {/* Description */}
      <p className="story-description">{story.description}</p>

      {/* Tags */}
      {story.tags.length > 0 && (
        <div className="story-tags">
          {story.tags.map((tag) => (
            <span key={tag} className="story-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Subtasks */}
      {totalCount > 0 && (
        <div className="story-subtasks">
          <div className="subtask-progress-row">
            <span className="subtask-count">{completedCount}/{totalCount} subtasks</span>
            <div className="subtask-progress-bar">
              <div className="subtask-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <ul className="subtask-list">
            {story.subtasks.map((subtask) => (
              <li key={subtask.id} className="subtask-item">
                <button
                  className={`subtask-check ${subtask.status === 'COMPLETED' ? 'checked' : ''}`}
                  onClick={() =>
                    onSubtaskToggle(
                      story.id,
                      subtask.id,
                      subtask.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
                    )
                  }
                  title={subtask.status === 'COMPLETED' ? 'Mark incomplete' : 'Mark complete'}
                >
                  {subtask.status === 'COMPLETED' ? '✓' : ''}
                </button>
                <span className={`subtask-title ${subtask.status === 'COMPLETED' ? 'done' : ''}`}>
                  {subtask.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="story-actions">
        {isDraft ? (
          <>
            <button className="action-btn approve" onClick={() => onApprove(story.id)}>
              ✓ Approve
            </button>
            <button className="action-btn reject" onClick={() => onReject(story.id)}>
              ✕ Reject
            </button>
          </>
        ) : (
          <div className="status-actions">
            {STATUS_PREV[story.status] && (
              <button
                className="action-btn secondary"
                onClick={() => onStatusChange(story.id, STATUS_PREV[story.status]!)}
              >
                ← {STATUS_PREV[story.status]}
              </button>
            )}
            {STATUS_NEXT[story.status] && (
              <button
                className="action-btn primary"
                onClick={() => onStatusChange(story.id, STATUS_NEXT[story.status]!)}
              >
                → {STATUS_NEXT[story.status]}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
