import { createRouter } from './router.ts';
import type { HandlerDeps } from './types.ts';

export const UI_PORT = 3333;

export const startUiServer = (deps: HandlerDeps): Deno.HttpServer => {
  const handler = createRouter(deps);
  const server = Deno.serve({ port: UI_PORT, hostname: '127.0.0.1' }, handler);
  console.log(`  ⬡  UI     → http://127.0.0.1:${UI_PORT}`);
  return server;
};
