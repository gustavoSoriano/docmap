import {
  createFavorite,
  deleteFavorite,
  getFavoriteById,
  listFavorites,
  recordAccess,
  updateFavorite,
} from './store.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import type { CreateFavoriteInput, UpdateFavoriteInput } from './types.ts';

export const favoritesHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/favorites\/?/, '').split('/')
      .filter(Boolean);
    const id = segments[0];
    const sub = segments[1]; // 'access'

    if (req.method === 'GET' && !id) {
      return json(await listFavorites(kv));
    }

    if (req.method === 'GET' && id) {
      const fav = await getFavoriteById(kv, id);
      if (!fav) return notFound();
      return json(fav);
    }

    if (req.method === 'POST' && !id) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const input = body as CreateFavoriteInput;
      if (!input.title || !input.url || !input.type || !input.category) {
        return badRequest('title, url, type and category are required');
      }
      return json(await createFavorite(kv, input), 201);
    }

    if (req.method === 'PUT' && id && sub === 'access') {
      const fav = await recordAccess(kv, id);
      if (!fav) return notFound();
      return json(fav);
    }

    if (req.method === 'PUT' && id && !sub) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const updated = await updateFavorite(kv, id, body as UpdateFavoriteInput);
      if (!updated) return notFound();
      return json(updated);
    }

    if (req.method === 'DELETE' && id) {
      return json({ ok: await deleteFavorite(kv, id) });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
