import { createRouter } from './router.ts';
import type { HandlerDeps } from './types.ts';

export const UI_PORT = 3333;

export const startUiServer = (deps: HandlerDeps): Deno.HttpServer => {
  const handler = createRouter(deps);
  const hostname = Deno.env.get('DOCMAP_HOST') || '127.0.0.1';
  const server = Deno.serve({ port: UI_PORT, hostname }, handler);
  console.log(`  ⬡  UI     → http://${hostname}:${UI_PORT}`);
  return server;
};
