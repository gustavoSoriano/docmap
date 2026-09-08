// Biblioteca de desenhos — CRUD de collections + desenhos salvos.
// Salvar/abrir usa o board ao vivo (hub) como fonte/destino; o documento
// vai pro filesystem e só os metadados ficam no KV.

import { boardHub } from './hub.ts';
import {
  createCollection,
  createDrawing,
  deleteCollection,
  deleteDrawing,
  ensureDefaultCollection,
  getCollection,
  getDrawing,
  listCollections,
  listDrawings,
  overwriteDrawing,
  readDocument,
  renameDrawing,
  updateCollection,
} from './store.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';
import type { DrawingOpenResponse } from './types.ts';

const MAX_NAME_LEN = 120;

const readJson = async (req: Request): Promise<unknown | null> => {
  try {
    return await req.json();
  } catch {
    return null;
  }
};

const cleanName = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const name = v.trim();
  if (!name || name.length > MAX_NAME_LEN) return null;
  return name;
};

export const createLibraryHandler = (deps: HandlerDeps) => {
  const { kv } = deps;

  return (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/canvas\/?/, '').split('/').filter(
      Boolean,
    );
    if (segments[0] === 'collections') {
      return handleCollections(req, segments.slice(1));
    }
    if (segments[0] === 'drawings') {
      return handleDrawings(req, url, segments.slice(1));
    }
    return Promise.resolve(notFound());
  };

  async function handleCollections(
    req: Request,
    seg: string[],
  ): Promise<Response> {
    const [id] = seg;

    if (req.method === 'GET' && !id) {
      const cols = await listCollections(kv);
      const counts = await Promise.all(cols.map((c) => listDrawings(kv, c.id)));
      return json(cols.map((c, i) => ({ ...c, drawings: counts[i].length })));
    }

    if (req.method === 'POST' && !id) {
      const body = await readJson(req);
      const name = body && typeof body === 'object' && !Array.isArray(body)
        ? cleanName((body as Record<string, unknown>).name)
        : null;
      if (!name) return badRequest('name required (1-120 chars)');
      const tags = (body as Record<string, unknown>).tags;
      return json(
        await createCollection(kv, {
          name,
          tags: Array.isArray(tags) ? tags.map(String) : undefined,
        }),
        201,
      );
    }

    if (!id) return json({ error: 'method_not_allowed' }, 405);
    if (req.method === 'PUT') {
      const body = await readJson(req);
      const name = body && typeof body === 'object' && !Array.isArray(body)
        ? cleanName((body as Record<string, unknown>).name)
        : null;
      if (!name) return badRequest('name required (1-120 chars)');
      const updated = await updateCollection(kv, id, { name });
      if (!updated) return notFound();
      return json(updated);
    }

    if (req.method === 'DELETE') {
      return json({ ok: await deleteCollection(kv, id) });
    }

    return json({ error: 'method_not_allowed' }, 405);
  }

  async function handleDrawings(
    req: Request,
    url: URL,
    seg: string[],
  ): Promise<Response> {
    const [id, action] = seg;

    // GET /canvas/drawings?collectionId= — metadados (sem snapshot).
    if (req.method === 'GET' && !id) {
      const colId = url.searchParams.get('collectionId') ?? undefined;
      return json(await listDrawings(kv, colId));
    }

    // POST /canvas/drawings { collectionId?, name, tags? } — salva o board.
    if (req.method === 'POST' && !id) {
      const body = await readJson(req);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return badRequest('invalid_json');
      }
      const rec = body as Record<string, unknown>;
      const name = cleanName(rec.name);
      if (!name) return badRequest('name required (1-120 chars)');
      const col = typeof rec.collectionId === 'string' && rec.collectionId
        ? await getCollection(kv, rec.collectionId)
        : await ensureDefaultCollection(kv);
      if (!col) return notFound();
      const saved = await createDrawing(kv, {
        collectionId: col.id,
        name,
        tags: Array.isArray(rec.tags) ? rec.tags.map(String) : undefined,
        snapshot: boardHub.getSnapshot(),
        shapes: boardHub.shapeCount,
      });
      if (!saved) return badRequest('invalid_snapshot');
      return json(saved, 201);
    }

    if (!id) return json({ error: 'method_not_allowed' }, 405);

    // POST /canvas/drawings/:id/open — carrega no board ao vivo p/ todos.
    if (req.method === 'POST' && action === 'open') {
      const meta = await getDrawing(kv, id);
      if (!meta) return notFound();
      const doc = await readDocument(meta.collectionId, id);
      if (!doc) return notFound();
      const err = boardHub.loadSnapshotData(doc.snapshot);
      if (err) return badRequest(err);
      const res: DrawingOpenResponse = {
        drawing: meta,
        snapshot: doc.snapshot,
      };
      return json(res);
    }

    // POST /canvas/drawings/:id/save — sobrescreve com o board atual.
    if (req.method === 'POST' && action === 'save') {
      const updated = await overwriteDrawing(kv, id, {
        snapshot: boardHub.getSnapshot(),
        shapes: boardHub.shapeCount,
      });
      if (!updated) return notFound();
      return json(updated);
    }

    if (req.method === 'GET' && !action) {
      const meta = await getDrawing(kv, id);
      if (!meta) return notFound();
      return json(meta);
    }

    if (req.method === 'PUT' && !action) {
      const body = await readJson(req);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return badRequest('invalid_json');
      }
      const rec = body as Record<string, unknown>;
      const input: { name?: string; collectionId?: string; tags?: string[] } =
        {};
      if (rec.name !== undefined) {
        const name = cleanName(rec.name);
        if (!name) return badRequest('name inválido (1-120 chars)');
        input.name = name;
      }
      if (rec.tags !== undefined) {
        if (!Array.isArray(rec.tags)) return badRequest('tags inválidas');
        input.tags = rec.tags.map(String);
      }
      if (rec.collectionId !== undefined) {
        if (typeof rec.collectionId !== 'string' || !rec.collectionId) {
          return badRequest('collectionId inválido');
        }
        input.collectionId = rec.collectionId;
      }
      const updated = await renameDrawing(kv, id, input);
      if (!updated) return notFound();
      return json(updated);
    }

    if (req.method === 'DELETE' && !action) {
      return json({ ok: await deleteDrawing(kv, id) });
    }

    return json({ error: 'method_not_allowed' }, 405);
  }
};
