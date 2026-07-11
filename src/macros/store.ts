import type {
  CreateMacroInput,
  Macro,
  MacroInterpreter,
  MacroPreview,
  UpdateMacroInput,
} from './types.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['macros', GLOBAL, id] as const;
const PREFIX = ['macros', GLOBAL] as const;

const detectInterpreter = (script: string): MacroInterpreter => {
  const first = script.split('\n')[0] ?? '';
  return first.includes('deno') ? 'deno' : 'bash';
};

const toSlug = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const toPreview = (m: Macro): MacroPreview => ({
  id: m.id,
  name: m.name,
  title: m.title,
  description: m.description,
  interpreter: m.interpreter,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
});

export const createMacro = async (
  kv: Deno.Kv,
  input: CreateMacroInput,
): Promise<Macro> => {
  const macro: Macro = {
    id: crypto.randomUUID(),
    name: toSlug(input.name || input.title),
    title: input.title,
    description: input.description,
    script: input.script,
    interpreter: detectInterpreter(input.script),
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
  return entry.value;
};

export const updateMacro = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateMacroInput,
): Promise<Macro | null> => {
  const existing = await getMacroById(kv, id);
  if (!existing) return null;
  const script = input.script ?? existing.script;
  const updated: Macro = {
    ...existing,
    ...(input.name !== undefined ? { name: toSlug(input.name) } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.script !== undefined
      ? { script, interpreter: detectInterpreter(script) }
      : {}),
    updatedAt: new Date().toISOString(),
  };
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

export const listMacros = async (kv: Deno.Kv): Promise<MacroPreview[]> => {
  const previews: MacroPreview[] = [];
  for await (const entry of kv.list<Macro>({ prefix: PREFIX })) {
    if (entry.value) previews.push(toPreview(entry.value));
  }
  return previews.sort((a, b) => a.name.localeCompare(b.name));
};
