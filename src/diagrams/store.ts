import type {
  CreateDiagramInput,
  Diagram,
  DiagramPreview,
  UpdateDiagramInput,
} from './types.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['diagrams', GLOBAL, id] as const;
const PREFIX = ['diagrams', GLOBAL] as const;

const toPreview = (d: Diagram): DiagramPreview => ({
  id: d.id,
  title: d.title,
  preview: d.source.slice(0, 120),
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

export const createDiagram = async (
  kv: Deno.Kv,
  input: CreateDiagramInput,
): Promise<Diagram> => {
  const diagram: Diagram = {
    id: crypto.randomUUID(),
    title: input.title,
    source: input.source,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(diagram.id), diagram);
  return diagram;
};

export const getDiagramById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Diagram | null> => {
  const entry = await kv.get<Diagram>(key(id));
  return entry.value;
};

export const updateDiagram = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateDiagramInput,
): Promise<Diagram | null> => {
  const existing = await getDiagramById(kv, id);
  if (!existing) return null;
  const updated: Diagram = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.source !== undefined ? { source: input.source } : {}),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(id), updated);
  return updated;
};

export const deleteDiagram = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const exists = await getDiagramById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  return true;
};

export const listDiagrams = async (kv: Deno.Kv): Promise<DiagramPreview[]> => {
  const previews: DiagramPreview[] = [];
  for await (const entry of kv.list<Diagram>({ prefix: PREFIX })) {
    if (entry.value) previews.push(toPreview(entry.value));
  }
  return previews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};
