import { createRouter } from './router.ts';
import type { HandlerDeps } from './types.ts';

export const UI_PORT = 3333;

// Bind padrão em 0.0.0.0: o docmap é acessível na rede local (tablet desenha
// no /canvas pelo browser). Override via DOCMAP_HOST (ex.: 127.0.0.1 para
// fechar a rede). A AI API (:3334) continua exclusiva em loopback.
export const uiHostname = (): string =>
  Deno.env.get('DOCMAP_HOST') || '0.0.0.0';

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
