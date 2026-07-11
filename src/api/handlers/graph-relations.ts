import { buildGraph } from '../../graph/builder.ts';
import { buildRelations } from '../../graph/relations.ts';
import {
  badRequest,
  json,
  notFound,
  noWorkspace,
} from '../../server/response.ts';
import type { HandlerDeps } from '../../server/types.ts';

export const createApiGraphRelationsHandler =
  ({ workspace }: HandlerDeps) =>
  async (_req: Request, url: URL): Promise<Response> => {
    if (!workspace.root) return noWorkspace();

    const file = url.searchParams.get('file');
    if (!file) return badRequest('Missing file param');

    const graph = await Promise.resolve(buildGraph(workspace.root));
    const nodeExists = graph.nodes.some((n) => n.id === file);
    if (!nodeExists) return notFound();

    return json(buildRelations(graph, file));
  };
