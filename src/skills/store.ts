import type {
  CreateSkillInput,
  Skill,
  SkillCollection,
  SkillPreview,
  UpdateSkillInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['skills', GLOBAL, id] as const;
const PREFIX = ['skills', GLOBAL] as const;
const COLLECTION_PREFIX = ['skill_collections'] as const;
const collectionKey = (id: string) => [...COLLECTION_PREFIX, id] as const;

// slug: minúsculo, sem espaços, só letras/números/hífen
export const toSlug = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const toPreview = (s: Skill): SkillPreview => ({
  id: s.id,
  name: s.name,
  title: s.title,
  description: s.description,
  tags: s.tags,
  ...(s.collectionId ? { collectionId: s.collectionId } : {}),
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

// ── Collections (padrão macros/mocks: delete preserva, clear esvazia) ──

export const listSkillCollections = async (
  kv: Deno.Kv,
): Promise<SkillCollection[]> => {
  const collections: SkillCollection[] = [];
  for await (
    const entry of kv.list<SkillCollection>({ prefix: COLLECTION_PREFIX })
  ) {
    if (entry.value) collections.push(entry.value);
  }
  return collections.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getSkillCollection = async (
  kv: Deno.Kv,
  id: string,
): Promise<SkillCollection | null> => {
  const entry = await kv.get<SkillCollection>(collectionKey(id));
  return entry.value;
};

export const createSkillCollection = async (
  kv: Deno.Kv,
  name: string,
): Promise<SkillCollection> => {
  const now = new Date().toISOString();
  const collection: SkillCollection = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(collectionKey(collection.id), collection);
  return collection;
};

export const updateSkillCollection = async (
  kv: Deno.Kv,
  id: string,
  name: string,
): Promise<SkillCollection | null> => {
  const existing = await getSkillCollection(kv, id);
  if (!existing) return null;
  const updated = {
    ...existing,
    name,
    updatedAt: new Date().toISOString(),
  };
  await kv.set(collectionKey(id), updated);
  return updated;
};

// Delete preserva as skills (vira "sem collection") — igual macros.
export const deleteSkillCollection = async (
  kv: Deno.Kv,
  id: string,
): Promise<{ deleted: boolean; unassigned: number }> => {
  const existing = await getSkillCollection(kv, id);
  if (!existing) return { deleted: false, unassigned: 0 };

  let unassigned = 0;
  for await (const entry of kv.list<Skill>({ prefix: PREFIX })) {
    if (entry.value?.collectionId !== id) continue;
    const skill = { ...entry.value } as Record<string, unknown>;
    delete skill.collectionId;
    skill.updatedAt = new Date().toISOString();
    await kv.set(entry.key, skill as Skill);
    unassigned += 1;
  }
  await kv.delete(collectionKey(id));
  return { deleted: true, unassigned };
};

// Clear esvazia a collection (deleta as skills, mantém a collection) — igual mocks.
export const clearSkillCollection = async (
  kv: Deno.Kv,
  id: string,
): Promise<number> => {
  const existing = await getSkillCollection(kv, id);
  if (!existing) return 0;
  let cleared = 0;
  for await (const entry of kv.list<Skill>({ prefix: PREFIX })) {
    if (entry.value?.collectionId !== id) continue;
    await kv.delete(entry.key);
    cleared += 1;
  }
  return cleared;
};

export const createSkill = async (
  kv: Deno.Kv,
  input: CreateSkillInput,
): Promise<Skill> => {
  const skill: Skill = {
    id: crypto.randomUUID(),
    name: toSlug(input.name) || toSlug(input.title),
    title: input.title,
    description: input.description,
    content: input.content,
    tags: normalizeTags(input.tags),
    ...(input.collectionId ? { collectionId: input.collectionId } : {}),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(skill.id), skill);
  return skill;
};

export const getSkillById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Skill | null> => {
  const entry = await kv.get<Skill>(key(id));
  return entry.value;
};

// resolve por ID ou por name (slug)
export const resolveSkill = async (
  kv: Deno.Kv,
  idOrName: string,
): Promise<Skill | null> => {
  const byId = await getSkillById(kv, idOrName);
  if (byId) return byId;
  // busca por name
  for await (const entry of kv.list<Skill>({ prefix: PREFIX })) {
    if (entry.value?.name === idOrName) return entry.value;
  }
  return null;
};

export const updateSkill = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateSkillInput,
): Promise<Skill | null> => {
  const existing = await getSkillById(kv, id);
  if (!existing) return null;
  const updated: Skill = {
    ...existing,
    ...(input.name !== undefined
      ? { name: toSlug(input.name) || existing.name }
      : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.content !== undefined ? { content: input.content } : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    ...(input.collectionId !== undefined && input.collectionId !== null
      ? { collectionId: input.collectionId }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  if (input.collectionId === null) {
    const base = { ...updated } as Record<string, unknown>;
    delete base.collectionId;
    await kv.set(key(id), base as Skill);
    return base as Skill;
  }
  await kv.set(key(id), updated);
  return updated;
};

export const deleteSkill = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const exists = await getSkillById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  return true;
};

export const listSkills = async (
  kv: Deno.Kv,
  collectionId?: string,
): Promise<SkillPreview[]> => {
  const previews: SkillPreview[] = [];
  for await (const entry of kv.list<Skill>({ prefix: PREFIX })) {
    if (!entry.value) continue;
    if (
      collectionId === undefined ||
      entry.value.collectionId === collectionId
    ) previews.push(toPreview(entry.value));
  }
  return previews.sort((a, b) => a.name.localeCompare(b.name));
};
