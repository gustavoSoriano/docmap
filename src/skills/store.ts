import type {
  CreateSkillInput,
  Skill,
  SkillPreview,
  UpdateSkillInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['skills', GLOBAL, id] as const;
const PREFIX = ['skills', GLOBAL] as const;

// slug: minúsculo, sem espaços, só letras/números/hífen
export const toSlug = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const toPreview = (s: Skill): SkillPreview => ({
  id: s.id,
  name: s.name,
  title: s.title,
  description: s.description,
  tags: s.tags,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

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
    updatedAt: new Date().toISOString(),
  };
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

export const listSkills = async (kv: Deno.Kv): Promise<SkillPreview[]> => {
  const previews: SkillPreview[] = [];
  for await (const entry of kv.list<Skill>({ prefix: PREFIX })) {
    if (entry.value) previews.push(toPreview(entry.value));
  }
  return previews.sort((a, b) => a.name.localeCompare(b.name));
};
