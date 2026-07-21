// ════ Store KV de podcasts (apenas metadados) ════
// O áudio MP3 NÃO vai no KV (limite ~64 KiB/valor) — ver audio.ts.

import { DEFAULT_FOLDER } from './voices.ts';
import {
  SCRIPT_KV_MAX,
  deleteScriptFile,
  readScriptFile,
  writeScriptFile,
} from './scriptfile.ts';
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
  const id = crypto.randomUUID();
  // Offload do script oversized já na criação (roteiro pronto via API).
  let script = data.script;
  let scriptFs: boolean | undefined;
  if (data.script.length > SCRIPT_KV_MAX) {
    await writeScriptFile(id, data.script);
    script = '';
    scriptFs = true;
  }
  const podcast: Podcast = {
    ...data,
    id,
    script,
    ...(scriptFs !== undefined ? { scriptFs } : {}),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(podcast.id), podcast);
  return podcast;
};

// Leitura "crua" do KV — sem hidratar script do FS. Usada em mutações
// (update/patch) para evitar regravar um script oversized de volta no KV.
const getPodcastRaw = async (
  kv: Deno.Kv,
  id: string,
): Promise<Podcast | null> => {
  const entry = await kv.get<Podcast>(key(id));
  return entry.value;
};

export const getPodcastById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Podcast | null> => {
  const p = await getPodcastRaw(kv, id);
  if (!p) return null;
  // Hidrata o script a partir do FS quando ele foi offloaded.
  if (p.scriptFs && !p.script) {
    const fromFs = await readScriptFile(id);
    if (fromFs !== null) return { ...p, script: fromFs };
  }
  return p;
};

export const updatePodcast = async (
  kv: Deno.Kv,
  id: string,
  input: UpdatePodcastInput,
): Promise<Podcast | null> => {
  const existing = await getPodcastRaw(kv, id);
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
  const existing = await getPodcastRaw(kv, id);
  if (!existing) return;
  // Offload do script quando oversized: escreve no FS e guarda flag.
  let scriptPatch: { script?: string; scriptFs?: boolean } = {};
  if (patch.script !== undefined) {
    if (patch.script.length > SCRIPT_KV_MAX) {
      await writeScriptFile(id, patch.script);
      scriptPatch = { script: '', scriptFs: true };
    } else {
      // Se o script voltou a ser pequeno, limpa o arquivo do FS (se houver).
      if (existing.scriptFs) await deleteScriptFile(id);
      scriptPatch = { script: patch.script, scriptFs: false };
    }
  }
  const updated: Podcast = {
    ...existing,
    ...scriptPatch,
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    // error presente → grava; ausente num patch de status → limpa erro antigo
    ...(patch.error !== undefined
      ? { error: patch.error }
      : patch.status !== undefined && patch.status !== 'error'
      ? { error: undefined }
      : {}),
    ...(patch.durationMs !== undefined ? { durationMs: patch.durationMs } : {}),
    ...(patch.slideMap !== undefined ? { slideMap: patch.slideMap } : {}),
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
