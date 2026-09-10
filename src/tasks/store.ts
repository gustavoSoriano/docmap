import type {
  CreateTaskInput,
  ReorderInput,
  Task,
  TaskChecklistItem,
  UpdateTaskInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['tasks', GLOBAL, id] as const;
const PREFIX = ['tasks', GLOBAL] as const;

const STATUS_ORDER: Record<string, number> = {
  'todo': 0,
  'in-progress': 1,
  'review': 2,
  'done': 3,
};

// Sanitiza checklist vinda de fora (API/UI): remove itens vazios, limita
// tamanho e garante shape { id, text, done }. Função pura.
export const normalizeChecklist = (
  input: readonly TaskChecklistItem[] | undefined,
): readonly TaskChecklistItem[] => {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item) => item && typeof item.text === 'string' && item.text.trim())
    .slice(0, 100)
    .map((item) => ({
      id: typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID(),
      text: item.text.trim().slice(0, 500),
      done: item.done === true,
    }));
};

export const listTasks = async (
  kv: Deno.Kv,
  projectId?: string,
): Promise<Task[]> => {
  const tasks: Task[] = [];
  for await (const entry of kv.list<Task>({ prefix: PREFIX })) {
    if (!entry.value) continue;
    if (projectId !== undefined && entry.value.projectId !== projectId) {
      continue;
    }
    tasks.push(entry.value);
  }
  return tasks.sort((a, b) => {
    const sc = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    return sc !== 0 ? sc : a.order - b.order;
  });
};

export const getTaskById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Task | null> => {
  const entry = await kv.get<Task>(key(id));
  return entry.value;
};

export const createTask = async (
  kv: Deno.Kv,
  input: CreateTaskInput,
): Promise<Task> => {
  const status = input.status ?? 'todo';
  const tasks = await listTasks(kv);
  const col = tasks.filter((t) => t.status === status);
  const maxOrd = col.length > 0 ? Math.max(...col.map((t) => t.order)) : -1;

  const task: Task = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description ?? '',
    status,
    order: input.order ?? maxOrd + 1,
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    ...(input.noteId ? { noteId: input.noteId } : {}),
    ...(input.projectId ? { projectId: input.projectId } : {}),
    tags: normalizeTags(input.tags),
    checklist: normalizeChecklist(input.checklist),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(task.id), task);
  return task;
};

export const updateTask = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateTaskInput,
): Promise<Task | null> => {
  const existing = await getTaskById(kv, id);
  if (!existing) return null;

  const base: Record<string, unknown> = {
    ...existing,
    updatedAt: new Date().toISOString(),
  };
  if (input.title !== undefined) base.title = input.title;
  if (input.description !== undefined) base.description = input.description;
  if (input.status !== undefined) base.status = input.status;
  if (input.order !== undefined) base.order = input.order;
  if (input.dueDate !== undefined) {
    if (input.dueDate === null) delete base.dueDate;
    else base.dueDate = input.dueDate;
  }
  if (input.noteId !== undefined) {
    if (input.noteId === null) delete base.noteId;
    else base.noteId = input.noteId;
  }
  if (input.projectId !== undefined) {
    if (input.projectId === null) delete base.projectId;
    else base.projectId = input.projectId;
  }
  if (input.tags !== undefined) base.tags = normalizeTags(input.tags);
  if (input.checklist !== undefined) {
    base.checklist = normalizeChecklist(input.checklist);
  } else if (!Array.isArray(base.checklist)) {
    // Compat: tasks antigas (pre-checklist) ganham o campo vazio ao salvar.
    base.checklist = [];
  }

  const updated = base as unknown as Task;
  await kv.set(key(id), updated);
  return updated;
};

export const deleteTask = async (kv: Deno.Kv, id: string): Promise<boolean> => {
  const exists = await getTaskById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  return true;
};

export const reorderColumn = async (
  kv: Deno.Kv,
  input: ReorderInput,
): Promise<void> => {
  const all = await listTasks(kv);
  const byId = new Map(all.map((t) => [t.id, t]));
  await Promise.all(
    input.ids.map((taskId, i) => {
      const task = byId.get(taskId);
      if (!task) return Promise.resolve();
      const updated = {
        ...task,
        status: input.status,
        order: i,
        updatedAt: new Date().toISOString(),
      } as Task;
      return kv.set(key(taskId), updated);
    }),
  );
};

export const unlinkProjectFromTasks = async (
  kv: Deno.Kv,
  projectId: string,
): Promise<number> => {
  let count = 0;
  for await (const entry of kv.list<Task>({ prefix: PREFIX })) {
    const task = entry.value;
    if (!task || task.projectId !== projectId) continue;
    const base = { ...task } as Record<string, unknown>;
    delete base.projectId;
    const updated = {
      ...base,
      updatedAt: new Date().toISOString(),
    } as Task;
    await kv.set(key(task.id), updated);
    count++;
  }
  return count;
};
