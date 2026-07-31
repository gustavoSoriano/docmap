import type {
  CreateMacroInput,
  Macro,
  MacroInterpreter,
  MacroPreview,
  UpdateMacroInput,
  WorkflowMacroArchive,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['macros', GLOBAL, id] as const;
const PREFIX = ['macros', GLOBAL] as const;
const ARCHIVE_PREFIX = ['workflow_macro_archives'] as const;
const archiveKey = (workflowId: string, macroId: string) =>
  ['workflow_macro_archives', workflowId, macroId] as const;

const detectInterpreter = (script: string): MacroInterpreter => {
  const first = script.split('\n')[0] ?? '';
  return first.includes('deno') ? 'deno' : 'bash';
};

const toSlug = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const normalizeMacro = (macro: Macro): Macro => ({
  ...macro,
  lifecycle: macro.lifecycle ?? (macro.workflowId ? 'workflow' : 'persistent'),
});

const toPreview = (value: Macro): MacroPreview => {
  const m = normalizeMacro(value);
  return {
    id: m.id,
    name: m.name,
    title: m.title,
    description: m.description,
    interpreter: m.interpreter,
    tags: m.tags,
    lifecycle: m.lifecycle,
    ...(m.workflowId ? { workflowId: m.workflowId } : {}),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
};

export const createMacro = async (
  kv: Deno.Kv,
  input: CreateMacroInput,
): Promise<Macro> => {
  const workflowId = input.workflowId?.trim();
  const lifecycle = input.lifecycle ?? (workflowId ? 'workflow' : 'persistent');
  const macro: Macro = {
    id: crypto.randomUUID(),
    name: toSlug(input.name || input.title),
    title: input.title,
    description: input.description ?? '',
    script: input.script,
    interpreter: detectInterpreter(input.script),
    tags: normalizeTags(input.tags),
    lifecycle,
    ...(workflowId ? { workflowId } : {}),
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

export const updateMacro = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateMacroInput,
): Promise<Macro | null> => {
  const existing = await getMacroById(kv, id);
  if (!existing) return null;
  const script = input.script ?? existing.script;
  const requestedWorkflowId = input.workflowId?.trim() ??
    (input.workflowId === undefined ? existing.workflowId : undefined);
  const lifecycle = input.lifecycle ??
    (input.workflowId !== undefined
      ? (requestedWorkflowId ? 'workflow' : 'persistent')
      : existing.lifecycle);
  const workflowId = lifecycle === 'workflow' ? requestedWorkflowId : undefined;
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
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    lifecycle,
    ...(workflowId ? { workflowId } : {}),
    updatedAt: new Date().toISOString(),
  };
  if (!workflowId) {
    const base = { ...updated } as Record<string, unknown>;
    delete base.workflowId;
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

export const listMacros = async (kv: Deno.Kv): Promise<MacroPreview[]> => {
  const previews: MacroPreview[] = [];
  for await (const entry of kv.list<Macro>({ prefix: PREFIX })) {
    if (entry.value) previews.push(toPreview(entry.value));
  }
  return previews.sort((a, b) => a.name.localeCompare(b.name));
};

const scriptHash = async (script: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(script),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const listWorkflowMacros = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<Macro[]> => {
  const macros: Macro[] = [];
  for await (const entry of kv.list<Macro>({ prefix: PREFIX })) {
    if (!entry.value) continue;
    const macro = normalizeMacro(entry.value);
    if (macro.lifecycle === 'workflow' && macro.workflowId === workflowId) {
      macros.push(macro);
    }
  }
  return macros.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const archiveAndDeleteWorkflowMacros = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<WorkflowMacroArchive[]> => {
  const macros = await listWorkflowMacros(kv, workflowId);
  const archives: WorkflowMacroArchive[] = [];
  for (const macro of macros) {
    const archive: WorkflowMacroArchive = {
      id: crypto.randomUUID(),
      workflowId,
      macroId: macro.id,
      name: macro.name,
      title: macro.title,
      interpreter: macro.interpreter,
      script: macro.script,
      scriptHash: await scriptHash(macro.script),
      archivedAt: new Date().toISOString(),
    };
    const result = await kv.atomic()
      .set(archiveKey(workflowId, macro.id), archive)
      .delete(key(macro.id))
      .commit();
    if (result.ok) archives.push(archive);
  }
  return archives;
};

export const deleteWorkflowMacros = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<number> => {
  const macros = await listWorkflowMacros(kv, workflowId);
  for (const macro of macros) await kv.delete(key(macro.id));
  return macros.length;
};

export const listWorkflowMacroArchives = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<WorkflowMacroArchive[]> => {
  const archives: WorkflowMacroArchive[] = [];
  for await (
    const entry of kv.list<WorkflowMacroArchive>({
      prefix: [...ARCHIVE_PREFIX, workflowId],
    })
  ) {
    if (entry.value) archives.push(entry.value);
  }
  return archives.sort((a, b) => a.archivedAt.localeCompare(b.archivedAt));
};

export const deleteWorkflowMacroArchives = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<number> => {
  let deleted = 0;
  for await (
    const entry of kv.list<WorkflowMacroArchive>({
      prefix: [...ARCHIVE_PREFIX, workflowId],
    })
  ) {
    await kv.delete(entry.key);
    deleted += 1;
  }
  return deleted;
};
