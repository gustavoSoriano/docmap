// ════ Store KV de podcasts (apenas metadados) ════
// O áudio MP3 NÃO vai no KV (limite ~64 KiB/valor) — ver audio.ts.

import { DEFAULT_FOLDER } from './voices.ts';
import type {
  GenerationPatch,
  Podcast,
  PodcastPreview,
  UpdatePodcastInput,
} from './types.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['podcasts', GLOBAL, id] as const;
const PREFIX = ['podcasts', GLOBAL] as const;

export const toPreview = (p: Podcast): PodcastPreview => ({
  id: p.id,
  title: p.title,
  folder: p.folder,
  voices: p.voices,
  status: p.status,
  ...(p.error !== undefined ? { error: p.error } : {}),
  ...(p.durationMs !== undefined ? { durationMs: p.durationMs } : {}),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export type CreatePodcastData = Omit<Podcast, 'id' | 'createdAt' | 'updatedAt'>;

export const createPodcast = async (
  kv: Deno.Kv,
  data: CreatePodcastData,
): Promise<Podcast> => {
  const podcast: Podcast = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(podcast.id), podcast);
  return podcast;
};

export const getPodcastById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Podcast | null> => {
  const entry = await kv.get<Podcast>(key(id));
  return entry.value;
};

export const updatePodcast = async (
  kv: Deno.Kv,
  id: string,
  input: UpdatePodcastInput,
): Promise<Podcast | null> => {
  const existing = await getPodcastById(kv, id);
  if (!existing) return null;
  const updated: Podcast = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.folder !== undefined
      ? { folder: input.folder.trim() || DEFAULT_FOLDER }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(id), updated);
  return updated;
};

// Usado exclusivamente pelo pipeline de geração.
export const patchGeneration = async (
  kv: Deno.Kv,
  id: string,
  patch: GenerationPatch,
): Promise<void> => {
  const existing = await getPodcastById(kv, id);
  if (!existing) return;
  const updated: Podcast = {
    ...existing,
    ...(patch.script !== undefined ? { script: patch.script } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    // error presente → grava; ausente num patch de status → limpa erro antigo
    ...(patch.error !== undefined
      ? { error: patch.error }
      : patch.status !== undefined && patch.status !== 'error'
      ? { error: undefined }
      : {}),
    ...(patch.durationMs !== undefined ? { durationMs: patch.durationMs } : {}),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(id), updated);
};

export const deletePodcast = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const exists = await getPodcastById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  return true;
};

export type ListFilter = { readonly q?: string; readonly folder?: string };

export const listPodcasts = async (
  kv: Deno.Kv,
  filter: ListFilter = {},
): Promise<PodcastPreview[]> => {
  const q = filter.q?.trim().toLowerCase();
  const previews: PodcastPreview[] = [];
  for await (const entry of kv.list<Podcast>({ prefix: PREFIX })) {
    if (!entry.value) continue;
    if (filter.folder && entry.value.folder !== filter.folder) continue;
    if (q && !entry.value.title.toLowerCase().includes(q)) continue;
    previews.push(toPreview(entry.value));
  }
  return previews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

// Pastas derivadas dos próprios podcasts (não há entidade separada).
export const listFolders = async (kv: Deno.Kv): Promise<string[]> => {
  const folders = new Set<string>();
  for await (const entry of kv.list<Podcast>({ prefix: PREFIX })) {
    if (entry.value) folders.add(entry.value.folder);
  }
  return [...folders].sort();
};
