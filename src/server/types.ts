import type { WorkspaceRef } from '../workspace/types.ts';

export type HandlerDeps = {
  readonly kv: Deno.Kv;
  readonly workspace: WorkspaceRef;
};

export type RouteHandler = (req: Request, url: URL) => Promise<Response>;
