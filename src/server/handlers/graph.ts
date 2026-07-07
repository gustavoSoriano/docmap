import { buildGraph } from '../../graph/builder.ts';
import { json, noWorkspace } from '../response.ts';
import type { HandlerDeps } from '../types.ts';

export const createGraphHandler = ({ workspace }: HandlerDeps) =>
  async (_req: Request, _url: URL): Promise<Response> => {
    if (!workspace.root) return noWorkspace();
    const graph = await Promise.resolve(buildGraph(workspace.root));
    return json(graph);
  };
