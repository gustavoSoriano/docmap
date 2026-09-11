import { createRouter } from './router.ts';
import type { HandlerDeps } from './types.ts';

export const UI_PORT = 3333;

// Bind padrão em loopback: a superfície principal inclui terminal, macros,
// backups e update. Use DOCMAP_HOST=0.0.0.0 apenas para expor o canvas na LAN.
export const uiHostname = (): string =>
  Deno.env.get('DOCMAP_HOST') || '127.0.0.1';

const lanUrls = (port: number): string[] => {
  try {
    return Deno.networkInterfaces()
      .filter((i) => i.family === 'IPv4' && !i.address.startsWith('127.'))
      .map((i) => `http://${i.address}:${port}`);
  } catch {
    return [];
  }
};

export const startUiServer = (deps: HandlerDeps): Deno.HttpServer => {
  const handler = createRouter(deps);
  const hostname = uiHostname();
  const server = Deno.serve({ port: UI_PORT, hostname }, handler);
  console.log(`  ⬡  UI     → http://${hostname}:${UI_PORT}`);
  for (const url of lanUrls(UI_PORT)) {
    console.log(`  ⬡  rede   → ${url}`);
  }
  return server;
};
