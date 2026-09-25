// Handler de categorias — montado nos routers :3333 (UI) e :3334 (AI).
// CRUD de categorias de notas (id = slug, descrição para a IA entender).
import {
  countNotesInCategory,
  createCategory,
  deleteCategory,
  getCategoryById,
  queryCategories,
  updateCategory,
} from './store.ts';
import { badRequest, conflict, json, notFound } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';
import type { CreateCategoryInput } from './types.ts';

export const categoriesHandler =
  ({ kv }: HandlerDeps) =>
  async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/categories\/?/, '').split('/')
      .filter(Boolean);
    const id = segments[0];

    if (req.method === 'GET' && !id) {
      const q = url.searchParams.get('q') ?? undefined;
      const rawLimit = Number(url.searchParams.get('limit') ?? '');
      const limit = Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), 500)
        : 200;
      const { items, total } = await queryCategories(kv, { q, limit });
      const withCount = await Promise.all(
        items.map(async (c) => ({
          ...c,
          notes: await countNotesInCategory(kv, c.id),
        })),
      );
      return json(withCount, 200, { 'X-Total-Count': String(total) });
    }

    if (req.method === 'GET' && id && !segments[1]) {
      const cat = await getCategoryById(kv, id);
      if (!cat) return notFound();
      return json({ ...cat, notes: await countNotesInCategory(kv, id) });
    }

    if (req.method === 'POST' && !id) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const input = body as CreateCategoryInput;
      if (!input.name?.trim()) return badRequest('name required');
      const created = await createCategory(kv, input);
      if (!created) return conflict('category already exists');
      return json(created, 201);
    }

    if (req.method === 'PUT' && id && !segments[1]) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const { name, description } = body as {
        name?: string;
        description?: string;
      };
      const updated = await updateCategory(kv, id, { name, description });
      return updated ? json(updated) : notFound();
    }

    if (req.method === 'DELETE' && id && !segments[1]) {
      const existing = await getCategoryById(kv, id);
      if (!existing) return notFound();
      const result = await deleteCategory(kv, id);
      return json({ ok: true, uncategorized: result.notes });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
