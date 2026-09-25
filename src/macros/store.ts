import type {
  CreateMacroInput,
  Macro,
  MacroCollection,
  MacroInterpreter,
  MacroPreview,
  UpdateMacroInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['macros', GLOBAL, id] as const;
const PREFIX = ['macros', GLOBAL] as const;
const COLLECTION_PREFIX = ['macro_collections'] as const;
const collectionKey = (id: string) => [...COLLECTION_PREFIX, id] as const;

const detectInterpreter = (script: string): MacroInterpreter => {
  const first = script.split('\n')[0] ?? '';
  return first.includes('deno') ? 'deno' : 'bash';
};

export const normalizeMacroName = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const normalizeMacro = (macro: Macro): Macro => ({
  ...macro,
  lifecycle: macro.lifecycle ?? 'persistent',
});

const normalizeInputLabel = (
  value: string | null | undefined,
): string | undefined => {
  const label = value?.trim();
  return label ? label : undefined;
};

export const listMacroCollections = async (
  kv: Deno.Kv,
): Promise<MacroCollection[]> => {
  const collections: MacroCollection[] = [];
  for await (
    const entry of kv.list<MacroCollection>({ prefix: COLLECTION_PREFIX })
  ) {
    if (entry.value) collections.push(entry.value);
  }
  return collections.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getMacroCollection = async (
  kv: Deno.Kv,
  id: string,
): Promise<MacroCollection | null> => {
  const entry = await kv.get<MacroCollection>(collectionKey(id));
  return entry.value;
};

export const createMacroCollection = async (
  kv: Deno.Kv,
  name: string,
): Promise<MacroCollection> => {
  const now = new Date().toISOString();
  const collection: MacroCollection = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(collectionKey(collection.id), collection);
  return collection;
};

export const updateMacroCollection = async (
  kv: Deno.Kv,
  id: string,
  name: string,
): Promise<MacroCollection | null> => {
  const existing = await getMacroCollection(kv, id);
  if (!existing) return null;
  const updated = {
    ...existing,
    name,
    updatedAt: new Date().toISOString(),
  };
  await kv.set(collectionKey(id), updated);
  return updated;
};

export const deleteMacroCollection = async (
  kv: Deno.Kv,
  id: string,
): Promise<{ deleted: boolean; unassigned: number }> => {
  const existing = await getMacroCollection(kv, id);
  if (!existing) return { deleted: false, unassigned: 0 };

  let unassigned = 0;
  for await (const entry of kv.list<Macro>({ prefix: PREFIX })) {
    if (entry.value?.collectionId !== id) continue;
    const macro = { ...entry.value } as Record<string, unknown>;
    delete macro.collectionId;
    macro.updatedAt = new Date().toISOString();
    await kv.set(entry.key, macro as Macro);
    unassigned += 1;
  }
  await kv.delete(collectionKey(id));
  return { deleted: true, unassigned };
};

// Clear esvazia a collection (deleta as macros, mantém a collection) — igual mocks.
export const clearMacroCollection = async (
  kv: Deno.Kv,
  id: string,
): Promise<number> => {
  const existing = await getMacroCollection(kv, id);
  if (!existing) return 0;
  let cleared = 0;
  for await (const entry of kv.list<Macro>({ prefix: PREFIX })) {
    if (entry.value?.collectionId !== id) continue;
    await kv.delete(entry.key);
    cleared += 1;
  }
  return cleared;
};

const toPreview = (value: Macro): MacroPreview => {
  const m = normalizeMacro(value);
  return {
    id: m.id,
    name: m.name,
    title: m.title,
    description: m.description,
    interpreter: m.interpreter,
    ...(m.inputLabel ? { inputLabel: m.inputLabel } : {}),
    tags: m.tags,
    ...(m.collectionId ? { collectionId: m.collectionId } : {}),
    lifecycle: m.lifecycle,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
};

export const createMacro = async (
  kv: Deno.Kv,
  input: CreateMacroInput,
): Promise<Macro> => {
  const lifecycle = input.lifecycle ?? 'persistent';
  const inputLabel = normalizeInputLabel(input.inputLabel);
  const macro: Macro = {
    id: crypto.randomUUID(),
    name: normalizeMacroName(input.name || input.title),
    title: input.title,
    description: input.description ?? '',
    script: input.script,
    ...(inputLabel ? { inputLabel } : {}),
    interpreter: detectInterpreter(input.script),
    tags: normalizeTags(input.tags),
    ...(input.collectionId ? { collectionId: input.collectionId } : {}),
    lifecycle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(macro.id), macro);
  return macro;
};

export const getMacroById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Macro | null> => {
  const entry = await kv.get<Macro>(key(id));
  return entry.value ? normalizeMacro(entry.value) : null;
};

export const getMacroByName = async (
  kv: Deno.Kv,
  name: string,
): Promise<Macro | null> => {
  const normalizedName = normalizeMacroName(name);
  for await (const entry of kv.list<Macro>({ prefix: PREFIX })) {
    if (entry.value && normalizeMacro(entry.value).name === normalizedName) {
      return normalizeMacro(entry.value);
    }
  }
  return null;
};

export const macroNameExists = async (
  kv: Deno.Kv,
  name: string,
  excludeId?: string,
): Promise<boolean> => {
  const normalizedName = normalizeMacroName(name);
  for await (const entry of kv.list<Macro>({ prefix: PREFIX })) {
    if (
      entry.value?.id !== excludeId &&
      entry.value &&
      normalizeMacro(entry.value).name === normalizedName
    ) return true;
  }
  return false;
};

export const getMacroByRef = async (
  kv: Deno.Kv,
  ref: string,
): Promise<Macro | null> =>
  await getMacroById(kv, ref) ?? await getMacroByName(kv, ref);

export const updateMacro = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateMacroInput,
): Promise<Macro | null> => {
  const existing = await getMacroById(kv, id);
  if (!existing) return null;
  const script = input.script ?? existing.script;
  const lifecycle = input.lifecycle ?? existing.lifecycle;
  const inputLabel = input.inputLabel !== undefined
    ? normalizeInputLabel(input.inputLabel)
    : existing.inputLabel;
  const shouldClearInputLabel = input.inputLabel !== undefined && !inputLabel;
  const updated: Macro = {
    ...existing,
    ...(input.name !== undefined
      ? { name: normalizeMacroName(input.name) }
      : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.script !== undefined
      ? { script, interpreter: detectInterpreter(script) }
      : {}),
    ...(inputLabel ? { inputLabel } : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    ...(input.collectionId !== undefined && input.collectionId !== null
      ? { collectionId: input.collectionId }
      : {}),
    lifecycle,
    updatedAt: new Date().toISOString(),
  };
  if (input.collectionId === null || shouldClearInputLabel) {
    const base = { ...updated } as Record<string, unknown>;
    if (input.collectionId === null) delete base.collectionId;
    if (!inputLabel) delete base.inputLabel;
    await kv.set(key(id), base as Macro);
    return base as Macro;
  }
  await kv.set(key(id), updated);
  return updated;
};

export const deleteMacro = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const exists = await getMacroById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  return true;
};

export const listMacros = async (
  kv: Deno.Kv,
  collectionId?: string,
): Promise<MacroPreview[]> => {
  const previews: MacroPreview[] = [];
  for await (const entry of kv.list<Macro>({ prefix: PREFIX })) {
    if (
      entry.value &&
      (collectionId === undefined || entry.value.collectionId === collectionId)
    ) previews.push(toPreview(entry.value));
  }
  return previews.sort((a, b) => a.name.localeCompare(b.name));
};
