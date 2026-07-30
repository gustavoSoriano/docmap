import { serveCanvasPage } from './page.ts';
import { canvasHub } from './hub.ts';
import { createImportFileHandler } from './import.ts';
import { createInspectHandler } from './inspect.ts';
import { json } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';

export const createCanvasHandler = (deps: HandlerDeps) => {
  const inspectHandler = createInspectHandler(deps);
  const importFileHandler = createImportFileHandler(deps);

  return (req: Request, url: URL): Response | Promise<Response> => {
    const { pathname } = url;

    if (req.method === 'GET' && pathname === '/canvas') {
      return serveCanvasPage();
    }

    if (pathname === '/canvas/ws') {
      return handleWebSocket(req);
    }

    if (req.method === 'POST' && pathname === '/canvas/push') {
      return handlePush(req);
    }

    if (req.method === 'POST' && pathname === '/canvas/clear') {
      canvasHub.broadcast({ type: 'clear' });
      return json({ ok: true, connections: canvasHub.connectionCount });
    }

    if (req.method === 'POST' && pathname === '/canvas/inspect') {
      return inspectHandler(req);
    }

    if (req.method === 'POST' && pathname === '/canvas/import-file') {
      return importFileHandler(req);
    }

    return new Response('Not found', { status: 404 });
  };
};

// ── WebSocket upgrade ──

function handleWebSocket(req: Request): Response {
  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    canvasHub.add(socket);
    return response;
  } catch {
    return new Response('WebSocket upgrade failed', { status: 400 });
  }
}

// ── Push de HTML pela IA externa ──

function isCanvasType(type: string): type is 'replace' | 'append' | 'css' | 'clear' {
  return type === 'replace' || type === 'append' || type === 'css' || type === 'clear';
}

async function handlePush(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Valida que body é um objeto (req.json() pode retornar null, array, string…)
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'invalid_body' }, 400);
  }

  const { html, type } = body as Record<string, unknown>;

  if (typeof type !== 'string' || !isCanvasType(type)) {
    return json({ error: 'invalid_type' }, 400);
  }
  if (typeof html !== 'string' && type !== 'clear') {
    return json({ error: 'html_required' }, 400);
  }

  canvasHub.broadcast({ type, html: html as string });
  return json({ ok: true, connections: canvasHub.connectionCount });
}
