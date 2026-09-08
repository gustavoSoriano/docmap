import { serveCanvasPage } from './page.ts';
import { boardHub, validateDiff } from './hub.ts';
import { isVendorFile, serveVendorFile, vendorVersion } from './vendor.ts';
import { json } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';
import type { BoardDiff, ClientMessage } from './types.ts';

const VENDOR_PREFIX = '/canvas/vendor/quickdraw/';

export const createCanvasHandler = (_deps: HandlerDeps) => {
  return (req: Request, url: URL): Response | Promise<Response> => {
    const { pathname } = url;

    if (req.method === 'GET' && pathname === '/canvas') {
      return serveCanvasPage();
    }

    if (req.method === 'GET' && pathname.startsWith(VENDOR_PREFIX)) {
      const name = pathname.slice(VENDOR_PREFIX.length);
      if (!isVendorFile(name)) {
        return new Response('Not found', { status: 404 });
      }
      return serveVendorFile(name);
    }

    if (req.method === 'GET' && pathname === '/canvas/info') {
      return json({
        vendor: `quickdraw@${vendorVersion()}`,
        peers: boardHub.connectionCount,
        shapes: boardHub.shapeCount,
      });
    }

    if (pathname === '/canvas/ws') {
      return handleWebSocket(req);
    }

    if (req.method === 'POST' && pathname === '/canvas/clear') {
      boardHub.clearBoard();
      return json({ ok: true, connections: boardHub.connectionCount });
    }

    return new Response('Not found', { status: 404 });
  };
};

// ── WebSocket upgrade ──

function handleWebSocket(req: Request): Response {
  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.addEventListener('message', (ev) => {
      handleClientMessage(socket, ev.data);
    });
    boardHub.add(socket);
    return response;
  } catch {
    return new Response('WebSocket upgrade failed', { status: 400 });
  }
}

// ── Cliente → servidor: apenas diffs de origem 'user' ──

const MAX_MSG_BYTES = 6 * 1024 * 1024;

function handleClientMessage(sender: WebSocket, data: unknown): void {
  if (typeof data !== 'string' || data.length > MAX_MSG_BYTES) return;
  let msg: unknown;
  try {
    msg = JSON.parse(data);
  } catch {
    return;
  }
  if (msg === null || typeof msg !== 'object' || Array.isArray(msg)) return;
  const { type, diff } = msg as Partial<ClientMessage>;
  if (type !== 'diff') return;
  const err = validateDiff(diff);
  if (err) {
    console.warn('canvas ws: diff inválido descartado:', err);
    return;
  }
  boardHub.applyUserDiff(diff as BoardDiff, sender);
}
