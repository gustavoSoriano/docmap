import type {
  CreateFavoriteInput,
  Favorite,
  FavoriteFilters,
  FavoriteSortBy,
  UpdateFavoriteInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const PREFIX = ['favorites'] as const;
const key = (id: string) => [...PREFIX, id] as const;

const normalize = (s: string): string => s.trim().toLowerCase();

const matchesFilters = (fav: Favorite, filters: FavoriteFilters): boolean => {
  const q = filters.q ? normalize(filters.q) : '';
  if (q) {
    const haystack = [fav.title, fav.url, fav.note, fav.category, ...fav.tags]
      .join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (filters.types?.length && !filters.types.includes(fav.type)) return false;

  if (filters.category) {
    if (!fav.category.toLowerCase().includes(normalize(filters.category))) {
      return false;
    }
  }

  if (filters.tags?.length) {
    // Tags salvas já são slugs normalizados — normaliza a query do mesmo jeito
    // pra casar (ex.: "Machine Learning" no filtro → "machine-learning").
    const favTags = new Set(fav.tags);
    const required = normalizeTags(filters.tags as string[]);
    if (!required.every((t) => favTags.has(t))) return false;
  }

  return true;
};

const sortFavorites = (
  items: Favorite[],
  sortBy: FavoriteSortBy,
  order: 'asc' | 'desc',
): Favorite[] => {
  const direction = order === 'asc' ? 1 : -1;

  return items.sort((a, b) => {
    let cmp = 0;

    if (sortBy === 'accessCount') {
      cmp = a.accessCount - b.accessCount;
      if (cmp === 0) cmp = b.createdAt.localeCompare(a.createdAt);
    } else if (sortBy === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else if (sortBy === 'createdAt') {
      cmp = a.createdAt.localeCompare(b.createdAt);
    } else if (sortBy === 'lastAccessed') {
      cmp = (a.lastAccessed ?? '').localeCompare(b.lastAccessed ?? '');
      if (cmp === 0) cmp = b.createdAt.localeCompare(a.createdAt);
    }

    return cmp * direction;
  });
};

export const searchFavorites = async (
  kv: Deno.Kv,
  filters: FavoriteFilters = {},
): Promise<Favorite[]> => {
  const items: Favorite[] = [];
  for await (const entry of kv.list<Favorite>({ prefix: PREFIX })) {
    if (entry.value && matchesFilters(entry.value, filters)) {
      items.push(entry.value);
    }
  }
  return sortFavorites(
    items,
    filters.sortBy ?? 'accessCount',
    filters.order ?? 'desc',
  );
};

export const listFavorites = (kv: Deno.Kv): Promise<Favorite[]> =>
  searchFavorites(kv);

export const getFavoriteById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Favorite | null> => {
  const entry = await kv.get<Favorite>(key(id));
  return entry.value;
};

export const createFavorite = async (
  kv: Deno.Kv,
  input: CreateFavoriteInput,
): Promise<Favorite> => {
  const fav: Favorite = {
    id: crypto.randomUUID(),
    type: input.type,
    title: input.title,
    url: input.url,
    category: input.category,
    tags: normalizeTags(input.tags),
    note: input.note ?? '',
    accessCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

  const base: Record<string, unknown> = {
    ...existing,
    updatedAt: new Date().toISOString(),
  };
  if (input.type !== undefined) base.type = input.type;
  if (input.title !== undefined) base.title = input.title;
  if (input.url !== undefined) base.url = input.url;
  if (input.category !== undefined) base.category = input.category;
  if (input.tags !== undefined) base.tags = normalizeTags(input.tags);
  if (input.note !== undefined) base.note = input.note;

  const updated = base as unknown as Favorite;
  await kv.set(key(id), updated);
  return updated;
};

export const recordAccess = async (
  kv: Deno.Kv,
  id: string,
): Promise<Favorite | null> => {
  const existing = await getFavoriteById(kv, id);
  if (!existing) return null;

  const updated: Favorite = {
    ...existing,
    accessCount: existing.accessCount + 1,
    lastAccessed: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(id), updated);
  return updated;
};

export const deleteFavorite = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const exists = await getFavoriteById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  return true;
};
