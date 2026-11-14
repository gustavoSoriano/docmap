import type {
  CreateTrilhaInput,
  Trilha,
  TrilhaGuardrail,
  UpdateTrilhaInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const cleanGuardrails = (
  raw: readonly string[] | undefined,
  existing: readonly TrilhaGuardrail[] = [],
): TrilhaGuardrail[] | undefined => {
  if (raw === undefined) return undefined;
  const now = new Date().toISOString();
  const byText = new Map(existing.map((g) => [g.text, g]));
  const seen = new Set<string>();
  const out: TrilhaGuardrail[] = [];
  for (const item of raw) {
    const text = item.trim().slice(0, 500);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    const prev = byText.get(text);
    out.push(prev ?? {
      id: crypto.randomUUID(),
      text,
      createdAt: now,
      updatedAt: now,
    });
  }
  return out;
};

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
    guardrails: cleanGuardrails(input.guardrails) ?? [],
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
    ...(input.guardrails !== undefined
      ? { guardrails: cleanGuardrails(input.guardrails, existing.guardrails) ?? [] }
      : {}),
    status,
    ...(status === 'done' && !existing.completedAt ? { completedAt: now } : {}),
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
