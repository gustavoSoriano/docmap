export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

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
};

export type ReorderInput = {
  readonly status: TaskStatus;
  readonly ids: readonly string[];
};
