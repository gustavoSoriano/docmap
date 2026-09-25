import type { Note } from '../notes/types.ts';
import { toCategoryId } from './slug.ts';
import type { Category, CreateCategoryInput } from './types.ts';

// Categorias são globais — não dependem do workspace aberto.
const GLOBAL = '_global_';
const key = (id: string) => ['categories', GLOBAL, id] as const;
const PREFIX = ['categories', GLOBAL] as const;
const NOTES_PREFIX = ['notes', GLOBAL] as const;

export const DEFAULT_CATEGORY_ID = 'general';

const now = (): string => new Date().toISOString();

const cleanName = (name: string): string => name.trim().slice(0, 60);

const cleanDescription = (description: string | undefined): string =>
  (description ?? '').trim().slice(0, 500);

export type QueryCategoriesOpts = {
  readonly q?: string;
  readonly limit?: number;
};

const matchesQuery = (c: Category, q: string): boolean => {
  if (!q) return true;
  return c.name.toLowerCase().includes(q) || c.id.includes(q) ||
    (c.description || '').toLowerCase().includes(q);
};

// Lista paginada com busca no servidor — a modal nunca precisa baixar o
// banco todo. Retorna a página e o total de matches (para "X de N").
export const queryCategories = async (
  kv: Deno.Kv,
  opts?: QueryCategoriesOpts,
): Promise<{ items: Category[]; total: number }> => {
  const q = (opts?.q ?? '').trim().toLowerCase();
  const cats: Category[] = [];
  for await (const entry of kv.list<Category>({ prefix: PREFIX })) {
    if (entry.value && matchesQuery(entry.value, q)) cats.push(entry.value);
  }
  cats.sort((a, b) => a.name.localeCompare(b.name));
  const total = cats.length;
  const limit = opts?.limit;
  const items = limit && limit > 0 ? cats.slice(0, limit) : cats;
  return { items, total };
};

export const listCategories = async (kv: Deno.Kv): Promise<Category[]> => {
  const { items } = await queryCategories(kv);
  return items;
};

export const getCategoryById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Category | null> => {
  const entry = await kv.get<Category>(key(id));
  return entry.value;
};

export const createCategory = async (
  kv: Deno.Kv,
  input: CreateCategoryInput,
): Promise<Category | null> => {
  const name = cleanName(input.name);
  if (!name) return null;
  const id = toCategoryId(name);
  if (await getCategoryById(kv, id)) return null;
  const stamp = now();
  const cat: Category = {
    id,
    name,
    description: cleanDescription(input.description),
    createdAt: stamp,
    updatedAt: stamp,
  };
  await kv.set(key(id), cat);
  return cat;
};

// Garante que a categoria existe (cria com descrição vazia se preciso).
// Aceita nome legado ("IA", "Estudos") ou id ("ia", "estudos").
export const ensureCategory = async (
  kv: Deno.Kv,
  nameOrId: string,
): Promise<Category> => {
  const name = cleanName(nameOrId) || DEFAULT_CATEGORY_ID;
  const id = toCategoryId(name);
  const existing = await getCategoryById(kv, id);
  if (existing) return existing;
  const stamp = now();
  const cat: Category = {
    id,
    name,
    description: '',
    createdAt: stamp,
    updatedAt: stamp,
  };
  await kv.set(key(id), cat);
  return cat;
};

export const updateCategory = async (
  kv: Deno.Kv,
  id: string,
  input: { name?: string; description?: string },
): Promise<Category | null> => {
  const existing = await getCategoryById(kv, id);
  if (!existing) return null;
  const updated: Category = {
    ...existing,
    ...(input.name !== undefined && cleanName(input.name)
      ? { name: cleanName(input.name) }
      : {}),
    ...(input.description !== undefined
      ? { description: cleanDescription(input.description) }
      : {}),
    updatedAt: now(),
  };
  await kv.set(key(id), updated);
  return updated;
};

export const countNotesInCategory = async (
  kv: Deno.Kv,
  id: string,
): Promise<number> => {
  let count = 0;
  for await (const entry of kv.list<Note>({ prefix: NOTES_PREFIX })) {
    if (entry.value?.category === id) count += 1;
  }
  return count;
};

export const deleteCategory = async (
  kv: Deno.Kv,
  id: string,
): Promise<{ deleted: boolean; notes: number }> => {
  // Excluir libera as notas: elas ficam sem categoria ('') em vez de
  // bloquear com 409. Vale para qualquer id, incluindo 'general'.
  let count = 0;
  const stamp = now();
  for await (const entry of kv.list<Note>({ prefix: NOTES_PREFIX })) {
    const note = entry.value;
    if (!note || note.category !== id) continue;
    count += 1;
    await kv.set(entry.key, { ...note, category: '', updatedAt: stamp });
  }
  await kv.delete(key(id));
  return { deleted: true, notes: count };
};
