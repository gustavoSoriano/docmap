import {
  createFavorite,
  deleteFavorite,
  getFavoriteById,
  recordAccess,
  searchFavorites,
  updateFavorite,
} from '../../favorites/store.ts';
import { badRequest, json, notFound } from '../../server/response.ts';
import type { HandlerDeps } from '../../server/types.ts';
import type {
  CreateFavoriteInput,
  FavoriteSortBy,
  UpdateFavoriteInput,
} from '../../favorites/types.ts';

const VALID_SORT_BY: readonly FavoriteSortBy[] = [
  'accessCount',
  'createdAt',
  'lastAccessed',
  'title',
];

const parseSortBy = (raw: string | null): FavoriteSortBy => {
  if (raw && (VALID_SORT_BY as readonly string[]).includes(raw)) {
    return raw as FavoriteSortBy;
  }
  return 'accessCount';
};

const parseOrder = (raw: string | null): 'asc' | 'desc' =>
  raw === 'asc' ? 'asc' : 'desc';

export const createApiFavoritesHandler = ({ kv }: HandlerDeps) =>
async (
  req: Request,
  url: URL,
): Promise<Response> => {
  const segments = url.pathname.replace(/^\/favorites\/?/, '').split('/')
    .filter(Boolean);
  const id = segments[0];
  const sub = segments[1];

  if (req.method === 'GET' && !id) {
    const q = url.searchParams.get('q')?.trim() || undefined;
    const types = url.searchParams.getAll('type').filter(
      Boolean,
    ) as CreateFavoriteInput['type'][];
    const category = url.searchParams.get('category')?.trim() || undefined;
    const tags = url.searchParams.getAll('tag').filter(Boolean);
    const sortBy = parseSortBy(url.searchParams.get('sortBy'));
    const order = parseOrder(url.searchParams.get('order'));

    return json(
      await searchFavorites(kv, {
        ...(q && { q }),
        ...(types.length && { types }),
        ...(category && { category }),
        ...(tags.length && { tags }),
        sortBy,
        order,
      }),
    );
  }

  if (req.method === 'GET' && id) {
    const fav = await getFavoriteById(kv, id);
    return fav ? json(fav) : notFound();
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

  if (req.method === 'PUT' && id && !sub) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest('Invalid JSON');
    }
    const updated = await updateFavorite(kv, id, body as UpdateFavoriteInput);
    return updated ? json(updated) : notFound();
  }

  if (req.method === 'PUT' && id && sub === 'access') {
    const fav = await recordAccess(kv, id);
    return fav ? json(fav) : notFound();
  }

  if (req.method === 'DELETE' && id) {
    return json({ ok: await deleteFavorite(kv, id) });
  }

  return json({ error: 'method_not_allowed' }, 405);
};
