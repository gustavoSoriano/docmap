import type {
  CreateNoteInput,
  Note,
  NotePreview,
  UpdateNoteInput,
} from './types.ts';

// Notas são globais — não dependem do workspace aberto.
const GLOBAL = '_global_';
const key = (id: string) => ['notes', GLOBAL, id] as const;
const PREFIX = ['notes', GLOBAL] as const;

const toPreview = (note: Note): NotePreview => ({
  id: note.id,
  title: note.title,
  tags: note.tags,
  category: note.category,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  preview: note.content.slice(0, 120),
});

export const createNote = async (
  kv: Deno.Kv,
  input: CreateNoteInput,
): Promise<Note> => {
  const note: Note = {
    id: crypto.randomUUID(),
    title: input.title,
    content: input.content,
    tags: input.tags ?? [],
    category: input.category?.trim() || 'general',
    ...(input.docSetId ? { docSetId: input.docSetId } : {}),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  const updated: Note = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.content !== undefined ? { content: input.content } : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(id), updated);
  return updated;
};

export const deleteNote = async (kv: Deno.Kv, id: string): Promise<boolean> => {
  const exists = await getNoteById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  return true;
};

export const listNotes = async (kv: Deno.Kv): Promise<NotePreview[]> => {
  const previews: NotePreview[] = [];
  for await (const entry of kv.list<Note>({ prefix: PREFIX })) {
    if (entry.value) previews.push(toPreview(entry.value));
  }
  return previews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};
