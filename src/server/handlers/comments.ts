import { getComments, upsertComment } from '../../comments/store.ts';
import { badRequest, json } from '../response.ts';
import type { HandlerDeps } from '../types.ts';
import type { CommentType } from '../../comments/types.ts';

const isNoteContext = (fileId: string): boolean => fileId.startsWith('note:');

export const createCommentsHandler =
  ({ kv }: HandlerDeps) =>
  async (req: Request, url: URL): Promise<Response> => {
    const fileId = url.searchParams.get('file') ?? '';
    if (!isNoteContext(fileId)) return badRequest('note context required');

    if (req.method === 'GET') return json(await getComments(kv, fileId));

    if (req.method === 'POST') {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const { file, quote, note, type } = body as Record<string, string>;
      if (file !== fileId || !quote) return badRequest('Invalid note context');
      const updated = await upsertComment(kv, fileId, {
        quote,
        note: note ?? '',
        type: (type ?? 'note') as CommentType,
      });
      return json(updated);
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
