import type {
  CreateTrilhaInput,
  Trilha,
  UpdateTrilhaInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const GLOBAL = '_global_';
const PREFIX = ['trilhas', GLOBAL] as const;
const key = (id: string) => ['trilhas', GLOBAL, id] as const;

export const listTrilhas = async (kv: Deno.Kv): Promise<Trilha[]> => {
  const items: Trilha[] = [];
  for await (const entry of kv.list<Trilha>({ prefix: PREFIX })) {
    if (entry.value) items.push(entry.value);
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getTrilha = async (
  kv: Deno.Kv,
  id: string,
): Promise<Trilha | null> => {
  const entry = await kv.get<Trilha>(key(id));
  return entry.value;
};

export const createTrilha = async (
  kv: Deno.Kv,
  input: CreateTrilhaInput,
): Promise<Trilha> => {
  const now = new Date().toISOString();
  const trilha: Trilha = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    objective: input.objective.trim(),
    description: input.description ?? '',
    tags: normalizeTags(input.tags),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(key(trilha.id), trilha);
  return trilha;
};

export const updateTrilha = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateTrilhaInput,
): Promise<Trilha | null> => {
  const existing = await getTrilha(kv, id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const status = input.status ?? existing.status;
  const updated: Trilha = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.objective !== undefined
      ? { objective: input.objective.trim() }
      : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    status,
    ...(status === 'done' && !existing.completedAt
      ? { completedAt: now }
      : {}),
    updatedAt: now,
  };
  await kv.set(key(id), updated);
  return updated;
};

export const deleteTrilha = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const existing = await getTrilha(kv, id);
  if (!existing) return false;
  await kv.delete(key(id));
  return true;
};
