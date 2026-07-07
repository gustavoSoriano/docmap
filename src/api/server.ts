import { createApiRouter } from './router.ts';
import type { HandlerDeps } from '../server/types.ts';

export const API_PORT = 3334;

export const startApiServer = (deps: HandlerDeps): Deno.HttpServer => {
  const handler = createApiRouter(deps);
  const server = Deno.serve({ port: API_PORT, hostname: '127.0.0.1' }, handler);
  console.log(`  🤖  AI API → http://127.0.0.1:${API_PORT}`);
  return server;
};
