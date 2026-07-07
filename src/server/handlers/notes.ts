import { createNote, getNoteById, updateNote, deleteNote, listNotes } from '../../notes/store.ts';
import { exportNotesToMarkdown } from '../../notes/export.ts';
import { json, badRequest, notFound } from '../response.ts';
import type { HandlerDeps } from '../types.ts';
import type { Note, CreateNoteInput, UpdateNoteInput } from '../../notes/types.ts';

export const createNotesHandler = ({ kv }: HandlerDeps) =>
  async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.split('/').filter(Boolean);
    const noteId   = segments[1];

    if (req.method === 'GET' && !noteId) {
      return json(await listNotes(kv));
    }

    if (req.method === 'GET' && noteId === 'export') {
      const all: Note[] = [];
      for await (const entry of kv.list<Note>({ prefix: ['notes', '_global_'] })) {
        if (entry.value) all.push(entry.value);
      }
      const md = exportNotesToMarkdown(all, 'docmap');
      return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
    }

    if (req.method === 'GET' && noteId) {
      const note = await getNoteById(kv, noteId);
      return note ? json(note) : notFound();
    }

    if (req.method === 'POST') {
      let body: unknown;
      try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }
      const input = body as CreateNoteInput;
      if (!input.title || !input.content) return badRequest('title and content required');
      return json(await createNote(kv, input), 201);
    }

    if (req.method === 'PUT' && noteId) {
      let body: unknown;
      try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }
      const updated = await updateNote(kv, noteId, body as UpdateNoteInput);
      return updated ? json(updated) : notFound();
    }

    if (req.method === 'DELETE' && noteId) {
      const deleted = await deleteNote(kv, noteId);
      return json({ ok: deleted });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
