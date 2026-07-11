import { searchNotes } from '../../notes/search.ts';
import { json } from '../../server/response.ts';
import type { HandlerDeps } from '../../server/types.ts';

export const createApiSearchHandler = ({ kv }: HandlerDeps) =>
async (
  _req: Request,
  url: URL,
): Promise<Response> => {
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (!q) return json([]);
  return json(await searchNotes(kv, q));
};
