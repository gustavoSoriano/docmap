import { buildGraph } from '../../graph/builder.ts';
import { json, noWorkspace } from '../../server/response.ts';
import type { HandlerDeps } from '../../server/types.ts';

export const createApiGraphHandler =
  ({ workspace }: HandlerDeps) =>
  async (_req: Request, _url: URL): Promise<Response> => {
    if (!workspace.root) return noWorkspace();
    const graph = await Promise.resolve(buildGraph(workspace.root));
    return json(graph);
  };
