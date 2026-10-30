// Rotas de exportar/importar o canvas. Como o backup do sistema: o webview
// não baixa via <a download> nem abre <input type=file>, então exportar
// grava direto em ~/Downloads e importar abre o diálogo nativo (osascript).
//
//   GET  /canvas/export       → pacote JSON bruto (curl / IA)
//   POST /canvas/export       → grava ~/Downloads/docmap-canvas-<data>.json
//   POST /canvas/import       → body = pacote JSON
//   POST /canvas/import-pick  → diálogo nativo de arquivo

import { openFileDialog } from '../window/dialog.ts';
import { json } from '../server/response.ts';
import { parseBundle } from './bundle.ts';
import { exportCanvas, importCanvas } from './transfer.ts';

/** Teto do arquivo lido do disco (mesmo do board.json + folga das macros). */
const MAX_FILE_BYTES = 24 * 1024 * 1024;

const stampOf = (iso: string): string =>
  iso.slice(0, 16).replace('T', '-').replace(':', '');

const saveToDownloads = async (kv: Deno.Kv): Promise<Response> => {
  const bundle = await exportCanvas(kv);
  const filename = `docmap-canvas-${stampOf(bundle.exportedAt)}.json`;
  const path = `${Deno.env.get('HOME') ?? '.'}/Downloads/${filename}`;
  await Deno.writeTextFile(path, JSON.stringify(bundle, null, 2));
  return json({
    ok: true,
    path,
    filename,
    shapes: Object.keys(bundle.snapshot.document.store).length,
    macros: bundle.macros.length,
  });
};

const importBody = async (kv: Deno.Kv, body: unknown): Promise<Response> => {
  const parsed = parseBundle(body);
  if ('error' in parsed) {
    return json({ error: 'invalid_bundle', message: parsed.error }, 400);
  }
  return json({ ok: true, ...await importCanvas(kv, parsed.bundle) });
};

const readPicked = async (path: string): Promise<unknown> => {
  const stat = await Deno.stat(path);
  if (!stat.isFile || stat.size > MAX_FILE_BYTES) {
    throw new Error('arquivo grande demais');
  }
  return JSON.parse(await Deno.readTextFile(path));
};

const importPicked = async (kv: Deno.Kv): Promise<Response> => {
  const path = await openFileDialog('Selecionar canvas do docmap');
  if (!path) return json({ cancelled: true });
  let body: unknown;
  try {
    body = await readPicked(path);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'arquivo inválido';
    return json({ error: 'invalid_file', message }, 400);
  }
  return importBody(kv, body);
};

const importPosted = async (kv: Deno.Kv, req: Request): Promise<Response> => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  return importBody(kv, body);
};

/** Responde as rotas de transferência; null se a rota não é daqui. */
export const routeCanvasTransfer = (
  kv: Deno.Kv,
  req: Request,
  pathname: string,
): Promise<Response> | null => {
  if (pathname === '/canvas/export') {
    if (req.method === 'GET') return exportCanvas(kv).then((b) => json(b));
    if (req.method === 'POST') return saveToDownloads(kv);
  }
  if (req.method !== 'POST') return null;
  if (pathname === '/canvas/import') return importPosted(kv, req);
  if (pathname === '/canvas/import-pick') return importPicked(kv);
  return null;
};
