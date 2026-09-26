import type {
  CreateStickyInput,
  StickyColor,
  TrilhaSticky,
  UpdateStickyInput,
} from './types.ts';

const GLOBAL = '_global_';
const PREFIX = ['trilha_stickies', GLOBAL] as const;
const key = (id: string) => ['trilha_stickies', GLOBAL, id] as const;

const COLORS: readonly StickyColor[] = ['yellow', 'pink', 'green', 'blue'];

export const isStickyColor = (value: unknown): value is StickyColor =>
  typeof value === 'string' &&
  (COLORS as readonly string[]).includes(value);

export const listStickies = async (
  kv: Deno.Kv,
  trilhaId: string,
): Promise<TrilhaSticky[]> => {
  const out: TrilhaSticky[] = [];
  for await (const entry of kv.list<TrilhaSticky>({ prefix: PREFIX })) {
    if (entry.value?.trilhaId === trilhaId) out.push(entry.value);
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getSticky = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaSticky | null> => {
  const entry = await kv.get<TrilhaSticky>(key(id));
  return entry.value;
};

export const createSticky = async (
  kv: Deno.Kv,
  trilhaId: string,
  input: CreateStickyInput,
  index: number,
): Promise<TrilhaSticky> => {
  const now = new Date().toISOString();
  const sticky: TrilhaSticky = {
    id: crypto.randomUUID(),
    trilhaId,
    text: input.text.trim().slice(0, 2000),
    color: isStickyColor(input.color) ? input.color : 'yellow',
    position: input.position ?? {
      x: 80 + (index % 5) * 220,
      y: 420 + Math.floor(index / 5) * 200,
    },
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(key(sticky.id), sticky);
  return sticky;
};

export const updateSticky = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateStickyInput,
): Promise<TrilhaSticky | null> => {
  const existing = await getSticky(kv, id);
  if (!existing) return null;
  const updated: TrilhaSticky = {
    ...existing,
    ...(input.text !== undefined
      ? { text: input.text.trim().slice(0, 2000) }
      : {}),
    ...(input.color !== undefined && isStickyColor(input.color)
      ? { color: input.color }
      : {}),
    ...(input.position !== undefined ? { position: input.position } : {}),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(id), updated);
  return updated;
};

export const deleteSticky = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaSticky | null> => {
  const existing = await getSticky(kv, id);
  if (!existing) return null;
  await kv.delete(key(id));
  return existing;
};

export const deleteStickiesOfTrilha = async (
  kv: Deno.Kv,
  trilhaId: string,
): Promise<void> => {
  for await (const entry of kv.list<TrilhaSticky>({ prefix: PREFIX })) {
    if (entry.value?.trilhaId === trilhaId) await kv.delete(entry.key);
  }
};
