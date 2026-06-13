export type StoryStatus = 'TODO' | 'PENDING' | 'COMPLETED';
export type Priority = 'low' | 'medium' | 'high';

export interface SubTask {
  id: string;
  title: string;
  description: string;
  status: StoryStatus;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  subtasks: SubTask[];
  status: StoryStatus;
  priority: Priority;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  approved: boolean | null;
}

/** Entries rendered in the agent chat panel */
export type ChatEntry =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'agent'; text: string; tools: string[]; loading: boolean }
  | { id: string; kind: 'story'; story: Story }
  | { id: string; kind: 'error'; text: string };
