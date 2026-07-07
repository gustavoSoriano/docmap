import { searchDocs } from '../../search/engine.ts';
import { json, noWorkspace } from '../response.ts';
import type { HandlerDeps } from '../types.ts';

export const createSearchHandler = ({ workspace }: HandlerDeps) =>
  async (_req: Request, url: URL): Promise<Response> => {
    if (!workspace.root) return noWorkspace();
    const q = url.searchParams.get('q')?.trim() ?? '';
    if (!q) return json([]);
    const results = searchDocs(workspace.root, q);
    return json(results);
  };
