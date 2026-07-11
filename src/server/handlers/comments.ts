import { getComments, upsertComment } from '../../comments/store.ts';
import { badRequest, json, noWorkspace } from '../response.ts';
import type { HandlerDeps } from '../types.ts';
import type { CommentType } from '../../comments/types.ts';

export const createCommentsHandler =
  ({ kv, workspace }: HandlerDeps) =>
  async (req: Request, url: URL): Promise<Response> => {
    if (!workspace.root) return noWorkspace();
    const ws = workspace.root;

    if (req.method === 'GET') {
      const fileId = url.searchParams.get('file') ?? '';
      const comments = await getComments(kv, ws, fileId);
      return json(comments);
    }

    if (req.method === 'POST') {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const { file, quote, note, type } = body as Record<string, string>;
      if (!file || !quote) return badRequest('Missing file or quote');
      const updated = await upsertComment(kv, ws, file, {
        quote,
        note: note ?? '',
        type: (type ?? 'note') as CommentType,
      });
      return json(updated);
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
