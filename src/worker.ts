// Server worker — roda os servidores HTTP numa thread separada.
// Necessário porque webview.run() (thread principal) bloqueia o event loop
// do Deno; mantendo os servidores aqui, eles seguem respondendo.

import './env.ts';
import { startUiServer, UI_PORT } from './server/server.ts';
import { API_PORT, startApiServer } from './api/server.ts';
import { MOCK_PORT, startMockServer } from './mocks/server.ts';
import { openAppKv } from './kv/path.ts';
import { runMigrations } from './kv/migrate.ts';
import { checkForUpdate } from './update/github.ts';
import { freePort } from './net/free-port.ts';
import type { HandlerDeps } from './server/types.ts';
import { warmVoicesCache } from './podcasts/voices.ts';

const post = (msg: unknown) =>
  (self as unknown as { postMessage: (m: unknown) => void }).postMessage(msg);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Tenta subir; se a porta ainda estiver presa (TIME_WAIT), espera e repete.
const startWithRetry = async (deps: HandlerDeps): Promise<void> => {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      startUiServer(deps);
      startApiServer(deps);
      startMockServer(deps.kv);
      return;
    } catch (err) {
      if (err instanceof Deno.errors.AddrInUse && attempt < 9) {
        await sleep(150);
        continue;
      }
      throw err;
    }
  }
};

const boot = async (): Promise<void> => {
  // Assume o lugar de qualquer instância anterior.
  await freePort(UI_PORT);
  await freePort(API_PORT);
  await freePort(MOCK_PORT);

  const kv = await openAppKv();
  await runMigrations(kv);

  await startWithRetry({ kv });

  post({ type: 'ready' });

  checkForUpdate()
    .then((status) => kv.set(['_meta', 'update'], status))
    .catch(() => {});

  // Pré-carrega a lista de vozes do edge-tts (não bloqueia).
  warmVoicesCache();
};

await boot();
