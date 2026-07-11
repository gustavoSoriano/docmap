import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from '../../notes/store.ts';
import { badRequest, json, notFound } from '../../server/response.ts';
import type { HandlerDeps } from '../../server/types.ts';
import type { CreateNoteInput, UpdateNoteInput } from '../../notes/types.ts';

export const createApiNotesHandler = ({ kv }: HandlerDeps) =>
async (
  req: Request,
  url: URL,
): Promise<Response> => {
  const segments = url.pathname.replace('/notes', '').split('/').filter(
    Boolean,
  );
  const noteId = segments[0];

  if (req.method === 'GET' && !noteId) {
    return json(await listNotes(kv));
  }

  if (req.method === 'GET' && noteId) {
    const note = await getNoteById(kv, noteId);
    return note ? json(note) : notFound();
  }

  if (req.method === 'POST') {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest('Invalid JSON');
    }
    const input = body as CreateNoteInput;
    if (!input.title || !input.content) {
      return badRequest('title and content required');
    }
    return json(await createNote(kv, input), 201);
  }

  if (req.method === 'PUT' && noteId) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest('Invalid JSON');
    }
    const updated = await updateNote(kv, noteId, body as UpdateNoteInput);
    return updated ? json(updated) : notFound();
  }

  if (req.method === 'DELETE' && noteId) {
    const deleted = await deleteNote(kv, noteId);
    return json({ ok: deleted });
  }

  return json({ error: 'method_not_allowed' }, 405);
};
