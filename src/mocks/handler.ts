import {
  clearAllMocks,
  clearCollectionMocks,
  createCollection,
  createMock,
  deleteCollection,
  deleteMock,
  getCollection,
  getMock,
  listCollections,
  listMocks,
  updateCollection,
  updateMock,
} from './store.ts';
import { clearAllDbs, clearCollectionDb } from './executor.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import { HTTP_METHODS } from './types.ts';
import type {
  CreateCollectionInput,
  CreateMockInput,
  HttpMethod,
  UpdateMockInput,
} from './types.ts';

// Handler compartilhado entre UI (:3333) e AI API (:3334).
// Rotas:
//   /mocks/collections[/:id]   → CRUD de collections
//   /mocks/clear               → DELETE apaga tudo
//   /mocks[/:id]               → CRUD de mocks
export const mocksHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/mocks\/?/, '').split('/').filter(
      Boolean,
    );

    // ── /mocks/collections ────────────────────────────────────────────────────
    if (segments[0] === 'collections') {
      const colId = segments[1];

      if (req.method === 'GET' && !colId) {
        return json(await listCollections(kv));
      }

      if (req.method === 'GET' && colId) {
        const col = await getCollection(kv, colId);
        if (!col) return notFound();
        const mocks = await listMocks(kv, colId);
        return json({ ...col, mocks });
      }

      if (req.method === 'POST') {
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return badRequest('Invalid JSON');
        }
        const { name } = body as CreateCollectionInput;
        if (!name?.trim()) return badRequest('name required');
        return json(await createCollection(kv, { name: name.trim() }), 201);
      }

      if (req.method === 'PUT' && colId) {
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return badRequest('Invalid JSON');
        }
        const { name } = body as { name: string };
        if (!name?.trim()) return badRequest('name required');
        const updated = await updateCollection(kv, colId, name.trim());
        if (!updated) return notFound();
        return json(updated);
      }

      // /mocks/collections/:id/clear  → remove mocks, mantém a collection
      if (req.method === 'DELETE' && colId && segments[2] === 'clear') {
        const cleared = await clearCollectionMocks(kv, colId);
        clearCollectionDb(colId);
        return json({ ok: true, cleared });
      }

      if (req.method === 'DELETE' && colId) {
        clearCollectionDb(colId);
        return json({ ok: await deleteCollection(kv, colId) });
      }

      return json({ error: 'method_not_allowed' }, 405);
    }

    // ── /mocks/clear ─────────────────────────────────────────────────────────
    if (segments[0] === 'clear' && req.method === 'DELETE') {
      await clearAllMocks(kv);
      clearAllDbs();
      return json({ ok: true });
    }

    // ── /mocks[/:id] ─────────────────────────────────────────────────────────
    const id = segments[0];

    if (req.method === 'GET' && !id) {
      const colId = url.searchParams.get('collectionId') ?? undefined;
      return json(await listMocks(kv, colId));
    }

    if (req.method === 'GET' && id) {
      const mock = await getMock(kv, id);
      if (!mock) return notFound();
      return json(mock);
    }

    if (req.method === 'POST') {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const input = body as CreateMockInput;
      if (!input.collectionId) return badRequest('collectionId required');
      if (
        !input.method ||
        !(HTTP_METHODS as readonly string[]).includes(input.method)
      ) {
        return badRequest(`method must be one of: ${HTTP_METHODS.join(', ')}`);
      }
      if (!input.path?.trim()) return badRequest('path required');
      if (input.script === undefined) return badRequest('script required');
      return json(
        await createMock(kv, {
          ...input,
          method: input.method as HttpMethod,
          path: input.path.trim(),
        }),
        201,
      );
    }

    if (req.method === 'PUT' && id) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const input = body as UpdateMockInput;
      if (
        input.method !== undefined &&
        !(HTTP_METHODS as readonly string[]).includes(input.method)
      ) {
        return badRequest(`method must be one of: ${HTTP_METHODS.join(', ')}`);
      }
      const updated = await updateMock(kv, id, input);
      if (!updated) return notFound();
      return json(updated);
    }

    if (req.method === 'DELETE' && id) {
      return json({ ok: await deleteMock(kv, id) });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
