import { createRouter } from './router.ts';
import type { HandlerDeps } from './types.ts';

export const UI_PORT = Number(Deno.env.get('DOCMAP_UI_PORT') ?? 3333);

// Bind fixo em loopback: a superfície inclui macros, backups e update,
// então a UI nunca é exposta na rede (sem override por env).
const UI_HOSTNAME = '127.0.0.1';

export const startUiServer = (deps: HandlerDeps): Deno.HttpServer => {
  const handler = createRouter(deps);
  const server = Deno.serve({ port: UI_PORT, hostname: UI_HOSTNAME }, handler);
  console.log(`  ⬡  UI     → http://${UI_HOSTNAME}:${UI_PORT}`);
  return server;
};
