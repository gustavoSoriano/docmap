import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from '../../notes/store.ts';
import {
  attachmentUrl,
  loadImageFromPath,
  readAttachment,
  saveAttachment,
} from '../../notes/attachments.ts';
import { exportNotesToMarkdown } from '../../notes/export.ts';
import { badRequest, json, notFound } from '../response.ts';
import type { HandlerDeps } from '../types.ts';
import type {
  CreateNoteInput,
  Note,
  UpdateNoteInput,
} from '../../notes/types.ts';

export const createNotesHandler = ({ kv }: HandlerDeps) =>
async (
  req: Request,
  url: URL,
): Promise<Response> => {
  const segments = url.pathname.split('/').filter(Boolean);
  const noteId = segments[1];

  // ── POST /notes/:id/attachments — upload de imagem colada ──
  // Aceita bytes crus (image/*) ou JSON { filePath } — para quando a área
  // de transferência traz referência de arquivo em vez dos dados.
  if (req.method === 'POST' && noteId && segments[2] === 'attachments') {
    const note = await getNoteById(kv, noteId);
    if (!note) return notFound();
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.toLowerCase().startsWith('application/json')) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const filePath = (body as { filePath?: unknown }).filePath;
      if (typeof filePath !== 'string' || !filePath.trim()) {
        return badRequest('filePath required');
      }
      const loaded = await loadImageFromPath(filePath);
      if (!loaded) return badRequest('cannot read image file (max 5MB: png/jpg/gif/webp)');
      const saved = await saveAttachment(noteId, loaded.bytes, loaded.mime);
      if (!saved) return badRequest('invalid image file');
      const url = attachmentUrl(noteId, saved.filename);
      return json({ filename: saved.filename, url, markdown: `![](${url})` }, 201);
    }
    if (!contentType.toLowerCase().startsWith('image/')) {
      return badRequest('content-type must be image/* or application/json');
    }
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await req.arrayBuffer());
    } catch {
      return badRequest('read_error');
    }
    const saved = await saveAttachment(noteId, bytes, contentType);
    if (!saved) return badRequest('invalid image (max 5MB: png/jpg/gif/webp)');
    const url = attachmentUrl(noteId, saved.filename);
    return json({ filename: saved.filename, url, markdown: `![](${url})` }, 201);
  }

  // ── GET /notes/:id/attachments/:file — serve a imagem ──
  if (req.method === 'GET' && noteId && segments[2] === 'attachments') {
    const file = await readAttachment(noteId, segments[3] ?? '');
    if (!file) return notFound();
    return new Response(file.bytes, {
      headers: {
        'Content-Type': file.contentType,
        'Content-Length': String(file.bytes.length),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  if (req.method === 'GET' && !noteId) {
    return json(await listNotes(kv));
  }

  if (req.method === 'GET' && noteId === 'export') {
    const all: Note[] = [];
    for await (
      const entry of kv.list<Note>({ prefix: ['notes', '_global_'] })
    ) {
      if (entry.value) all.push(entry.value);
    }
    const md = exportNotesToMarkdown(all, 'docmap');
    return new Response(md, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
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
