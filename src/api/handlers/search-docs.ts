import { searchDocs } from '../../search/engine.ts';
import { json, noWorkspace } from '../../server/response.ts';
import type { HandlerDeps } from '../../server/types.ts';

export const createApiSearchDocsHandler =
  ({ workspace }: HandlerDeps) => (_req: Request, url: URL): Response => {
    if (!workspace.root) return noWorkspace();
    const q = url.searchParams.get('q')?.trim() ?? '';
    if (!q) return json([]);
    return json(searchDocs(workspace.root, q));
  };
