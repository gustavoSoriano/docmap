import { isPathSafe } from '../../fs/walker.ts';
import { json, badRequest, notFound, noWorkspace } from '../response.ts';
import type { HandlerDeps } from '../types.ts';

export const createContentHandler = ({ workspace }: HandlerDeps) =>
  async (_req: Request, url: URL): Promise<Response> => {
    if (!workspace.root) return noWorkspace();

    const fileParam = url.searchParams.get('file');
    if (!fileParam) return badRequest('Missing file param');

    const resolved = `${workspace.root}/${fileParam}`.replace(/\/\.\//g, '/');
    if (!isPathSafe(workspace.root, resolved)) return badRequest('Invalid path');

    try {
      const raw = await Deno.readTextFile(resolved);
      return json({ path: fileParam, raw });
    } catch {
      return notFound();
    }
  };
