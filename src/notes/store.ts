import type {
  CreateNoteInput,
  Note,
  NotePreview,
  UpdateNoteInput,
} from './types.ts';
import { ensureCategory } from '../categories/store.ts';
import { deleteNoteAttachments } from './attachments.ts';
import { normalizeTags } from '../tags/normalize.ts';

// Notas são globais — não dependem do workspace aberto.
const GLOBAL = '_global_';
const key = (id: string) => ['notes', GLOBAL, id] as const;
const PREFIX = ['notes', GLOBAL] as const;

import { MAX_OBSOLETE_REASON } from './types.ts';

const cleanReason = (raw: string | undefined): string | undefined => {
  const t = (raw ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return undefined;
  return t.slice(0, MAX_OBSOLETE_REASON);
};

const toPreview = (note: Note): NotePreview => ({
  id: note.id,
  title: note.title,
  tags: note.tags,
  category: note.category,
  ...(note.supersededBy ? { supersededBy: note.supersededBy } : {}),
  ...(note.supersededAt ? { supersededAt: note.supersededAt } : {}),
  ...(note.obsoleteReason ? { obsoleteReason: note.obsoleteReason } : {}),
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  preview: note.content.slice(0, 120),
});

// supersededBy aponta para a nota nova que substitui esta.
// Validação mínima: existe, não é auto-referência, sem ciclo direto A<->B.
const resolveSupersededBy = async (
  kv: Deno.Kv,
  selfId: string | null,
  raw: string | undefined,
): Promise<string | undefined> => {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return undefined;
  if (selfId && trimmed === selfId) throw new Error('supersededBy cannot be self');
  const target = await getNoteById(kv, trimmed);
  if (!target) throw new Error('supersededBy target not found');
  if (selfId && target.supersededBy === selfId) {
    throw new Error('supersededBy would create a cycle');
  }
  return target.id;
};

// Categoria vazia ('') = nota sem categoria. Só chama ensureCategory quando
// há texto — assim nada é forçado para 'general' nem recriado à toa.
const resolveCategory = async (
  kv: Deno.Kv,
  raw: string | undefined,
): Promise<string> => {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  return (await ensureCategory(kv, trimmed)).id;
};

export const createNote = async (
  kv: Deno.Kv,
  input: CreateNoteInput,
): Promise<Note> => {
  const category = await resolveCategory(kv, input.category);
  const supersededBy = input.supersededBy !== undefined
    ? await resolveSupersededBy(kv, null, input.supersededBy)
    : undefined;
  const obsoleteReason = supersededBy ? cleanReason(input.obsoleteReason) : undefined;
  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    title: input.title,
    content: input.content,
    tags: normalizeTags(input.tags),
    category,
    ...(supersededBy ? { supersededBy, supersededAt: now } : {}),
    ...(obsoleteReason ? { obsoleteReason } : {}),
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(key(note.id), note);
  return note;
};

export const getNoteById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Note | null> => {
  const entry = await kv.get<Note>(key(id));
  return entry.value;
};

export const updateNote = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateNoteInput,
): Promise<Note | null> => {
  const existing = await getNoteById(kv, id);
  if (!existing) return null;
  const category = input.category !== undefined
    ? await resolveCategory(kv, input.category)
    : existing.category;
  let supersededBy = existing.supersededBy;
  let supersededAt = existing.supersededAt;
  let obsoleteReason = existing.obsoleteReason;
  if (input.clearSuperseded) {
    supersededBy = undefined;
    supersededAt = undefined;
    obsoleteReason = undefined;
  } else if (input.supersededBy !== undefined) {
    const resolved = await resolveSupersededBy(kv, id, input.supersededBy);
    supersededBy = resolved;
    supersededAt = resolved ? new Date().toISOString() : undefined;
    obsoleteReason = resolved
      ? (input.obsoleteReason !== undefined ? cleanReason(input.obsoleteReason) : existing.obsoleteReason)
      : undefined;
  } else if (input.obsoleteReason !== undefined && supersededBy) {
    obsoleteReason = cleanReason(input.obsoleteReason);
  }
  const updated: Note = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.content !== undefined ? { content: input.content } : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    category,
    ...(supersededBy ? { supersededBy, supersededAt } : {
      supersededBy: undefined,
      supersededAt: undefined,
    }),
    ...(obsoleteReason && supersededBy ? { obsoleteReason } : { obsoleteReason: undefined }),
    updatedAt: new Date().toISOString(),
  };
  // Remove chaves undefined para não poluir o KV.
  if (!supersededBy) {
    delete (updated as { supersededBy?: string }).supersededBy;
    delete (updated as { supersededAt?: string }).supersededAt;
    delete (updated as { obsoleteReason?: string }).obsoleteReason;
  } else if (!obsoleteReason) {
    delete (updated as { obsoleteReason?: string }).obsoleteReason;
  }
  await kv.set(key(id), updated);
  return updated;
};

export const deleteNote = async (kv: Deno.Kv, id: string): Promise<boolean> => {
  const exists = await getNoteById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  await deleteNoteAttachments(id);
  return true;
};

export const listNotes = async (kv: Deno.Kv): Promise<NotePreview[]> => {
  const previews: NotePreview[] = [];
  for await (const entry of kv.list<Note>({ prefix: PREFIX })) {
    if (entry.value) previews.push(toPreview(entry.value));
  }
  return previews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};
