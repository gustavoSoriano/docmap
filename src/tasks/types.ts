export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type Task = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly order: number;
  readonly dueDate?: string; // YYYY-MM-DD
  readonly noteId?: string;
  readonly docSetId?: string;
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
  readonly docSetId?: string;
};

export type UpdateTaskInput = {
  readonly title?: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly order?: number;
  readonly dueDate?: string | null; // null = remover campo
  readonly noteId?: string | null; // null = remover campo
};

export type ReorderInput = {
  readonly status: TaskStatus;
  readonly ids: readonly string[];
};
