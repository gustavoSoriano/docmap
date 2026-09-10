export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type TaskChecklistItem = {
  readonly id: string;
  readonly text: string;
  readonly done: boolean;
};

export type Task = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly order: number;
  readonly dueDate?: string; // YYYY-MM-DD
  readonly noteId?: string;
  readonly projectId?: string;
  readonly tags: readonly string[]; // tema/assunto — eixo do grafo
  readonly checklist: readonly TaskChecklistItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateTaskInput = {
  readonly title: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly order?: number;
  readonly dueDate?: string;
  readonly noteId?: string;
  readonly projectId?: string;
  readonly tags?: readonly string[];
  readonly checklist?: readonly TaskChecklistItem[];
};

export type UpdateTaskInput = {
  readonly title?: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly order?: number;
  readonly dueDate?: string | null; // null = remover campo
  readonly noteId?: string | null; // null = remover campo
  readonly projectId?: string | null; // null = remover campo
  readonly tags?: readonly string[];
  readonly checklist?: readonly TaskChecklistItem[];
};

export type ReorderInput = {
  readonly status: TaskStatus;
  readonly ids: readonly string[];
};
