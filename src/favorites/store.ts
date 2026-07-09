import type { Favorite, CreateFavoriteInput, UpdateFavoriteInput } from './types.ts';

const PREFIX = ['favorites'] as const;
const key    = (id: string) => [...PREFIX, id] as const;

export const listFavorites = async (kv: Deno.Kv): Promise<Favorite[]> => {
  const items: Favorite[] = [];
  for await (const entry of kv.list<Favorite>({ prefix: PREFIX })) {
    if (entry.value) items.push(entry.value);
  }
  return items.sort((a, b) => {
    if (b.accessCount !== a.accessCount) return b.accessCount - a.accessCount;
    return b.createdAt.localeCompare(a.createdAt);
  });
};

export const getFavoriteById = async (kv: Deno.Kv, id: string): Promise<Favorite | null> => {
  const entry = await kv.get<Favorite>(key(id));
  return entry.value;
};

export const createFavorite = async (kv: Deno.Kv, input: CreateFavoriteInput): Promise<Favorite> => {
  const fav: Favorite = {
    id:          crypto.randomUUID(),
    type:        input.type,
    title:       input.title,
    url:         input.url,
    category:    input.category,
    tags:        input.tags ?? [],
    note:        input.note ?? '',
    accessCount: 0,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  };
  await kv.set(key(fav.id), fav);
  return fav;
};

export const updateFavorite = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateFavoriteInput,
): Promise<Favorite | null> => {
  const existing = await getFavoriteById(kv, id);
  if (!existing) return null;

  const base: Record<string, unknown> = { ...existing, updatedAt: new Date().toISOString() };
  if (input.type     !== undefined) base.type     = input.type;
  if (input.title    !== undefined) base.title    = input.title;
  if (input.url      !== undefined) base.url      = input.url;
  if (input.category !== undefined) base.category = input.category;
  if (input.tags     !== undefined) base.tags     = input.tags;
  if (input.note     !== undefined) base.note     = input.note;

  const updated = base as unknown as Favorite;
  await kv.set(key(id), updated);
  return updated;
};

export const recordAccess = async (kv: Deno.Kv, id: string): Promise<Favorite | null> => {
  const existing = await getFavoriteById(kv, id);
  if (!existing) return null;

  const updated: Favorite = {
    ...existing,
    accessCount:  existing.accessCount + 1,
    lastAccessed: new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
  };
  await kv.set(key(id), updated);
  return updated;
};

export const deleteFavorite = async (kv: Deno.Kv, id: string): Promise<boolean> => {
  const exists = await getFavoriteById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  return true;
};
