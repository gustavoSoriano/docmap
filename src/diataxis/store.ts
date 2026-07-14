import type { DocSet, DocSetPreview, CreateDocSetInput, UpdateDocSetInput } from './types.ts';

const key = (workspace: string, id: string) => ['docsets', workspace, id] as const;
const prefix = (workspace: string) => ['docsets', workspace] as const;

export const createDocSet = async (
  kv: Deno.Kv,
  input: CreateDocSetInput,
): Promise<DocSet> => {
  const docSet: DocSet = {
    id: crypto.randomUUID(),
    workspace: input.workspace,
    title: input.title,
    purpose: input.purpose,
    audience: input.audience,
    depth: input.depth ?? 'complete',
    items: input.items,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(docSet.workspace, docSet.id), docSet);
  return docSet;
};

export const getDocSetById = async (
  kv: Deno.Kv,
  workspace: string,
  id: string,
): Promise<DocSet | null> => {
  const entry = await kv.get<DocSet>(key(workspace, id));
  return entry.value;
};

export const updateDocSet = async (
  kv: Deno.Kv,
  workspace: string,
  id: string,
  input: UpdateDocSetInput,
): Promise<DocSet | null> => {
  const existing = await getDocSetById(kv, workspace, id);
  if (!existing) return null;

  const updated: DocSet = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
    ...(input.audience !== undefined
      ? { audience: input.audience ?? undefined }
      : {}),
    ...(input.depth !== undefined ? { depth: input.depth } : {}),
    ...(input.items !== undefined ? { items: input.items } : {}),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(workspace, id), updated);
  return updated;
};

export const deleteDocSet = async (
  kv: Deno.Kv,
  workspace: string,
  id: string,
): Promise<boolean> => {
  const exists = await getDocSetById(kv, workspace, id);
  if (!exists) return false;
  await kv.delete(key(workspace, id));
  return true;
};

export const listDocSetsByWorkspace = async (
  kv: Deno.Kv,
  workspace: string,
): Promise<DocSetPreview[]> => {
  const previews: DocSetPreview[] = [];
  for await (const entry of kv.list<DocSet>({ prefix: prefix(workspace) })) {
    if (!entry.value) continue;
    const { items: _, ...preview } = entry.value;
    previews.push(preview);
  }
  return previews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};
