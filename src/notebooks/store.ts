// Store KV dos cadernos — só metadados (ver body-file.ts p/ o corpo).
import type { ArtifactKind } from '../codetour/artifacts.ts';
import type { TourDepth } from '../codetour/types.ts';
import type { NotebookLinks, NotebookMeta, NotebookProgress } from './types.ts';
import { notebookTag } from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['notebooks', GLOBAL, id] as const;
const PREFIX = ['notebooks', GLOBAL] as const;

export const emptyLinks = (): NotebookLinks => ({
  podcastId: null,
  canvasShapeIds: [],
  canvasAt: null,
});

export const emptyProgress = (): NotebookProgress => ({
  listened: [],
  quiz: {},
});

export type CreateNotebookData = {
  readonly title: string;
  readonly query: string;
  readonly projectRoot: string;
  readonly depth: TourDepth;
  readonly artifacts: readonly ArtifactKind[];
  readonly reels: number;
};

export const createNotebookMeta = async (
  kv: Deno.Kv,
  data: CreateNotebookData,
): Promise<NotebookMeta> => {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const meta: NotebookMeta = {
    id,
    title: data.title.slice(0, 120) || 'Caderno sem título',
    query: data.query,
    projectRoot: data.projectRoot,
    depth: data.depth,
    tags: normalizeTags(['caderno', notebookTag(id)]),
    artifacts: data.artifacts,
    links: emptyLinks(),
    progress: emptyProgress(),
    reels: data.reels,
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(key(meta.id), meta);
  return meta;
};

export const getNotebookMeta = async (
  kv: Deno.Kv,
  id: string,
): Promise<NotebookMeta | null> => {
  const entry = await kv.get<NotebookMeta>(key(id));
  return entry.value;
};

export const listNotebookMetas = async (
  kv: Deno.Kv,
): Promise<NotebookMeta[]> => {
  const out: NotebookMeta[] = [];
  for await (const e of kv.list<NotebookMeta>({ prefix: PREFIX })) {
    if (e.value) {
      out.push(
        Array.isArray(e.value.tags) ? e.value : { ...e.value, tags: [] },
      );
    }
  }
  out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return out;
};

export type PatchNotebookData = {
  readonly title?: string;
  readonly artifacts?: readonly ArtifactKind[];
  readonly links?: NotebookLinks;
  readonly progress?: NotebookProgress;
};

export const patchNotebookMeta = async (
  kv: Deno.Kv,
  id: string,
  patch: PatchNotebookData,
): Promise<NotebookMeta | null> => {
  const existing = await getNotebookMeta(kv, id);
  if (!existing) return null;
  const updated: NotebookMeta = {
    ...existing,
    ...(patch.title !== undefined ? { title: patch.title.slice(0, 120) } : {}),
    ...(patch.artifacts !== undefined ? { artifacts: patch.artifacts } : {}),
    ...(patch.links !== undefined ? { links: patch.links } : {}),
    ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(id), updated);
  return updated;
};

export const deleteNotebookMeta = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const existing = await getNotebookMeta(kv, id);
  if (!existing) return false;
  await kv.delete(key(id));
  return true;
};
