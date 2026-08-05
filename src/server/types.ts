export type HandlerDeps = {
  readonly kv: Deno.Kv;
};

export type RouteHandler = (req: Request, url: URL) => Promise<Response>;
