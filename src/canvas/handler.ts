import { serveCanvasPage } from './page.ts';
import { boardHub, validateDiff, validateFrame } from './hub.ts';
import { isVendorFile, serveVendorFile, vendorVersion } from './vendor.ts';
import { json } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';
import type {
  BoardDiff,
  CanvasFrameResponse,
  CanvasInfoResponse,
  CanvasSnapshotResponse,
  ClientMessage,
} from './types.ts';

const VENDOR_PREFIX = '/canvas/vendor/quickdraw/';

const PNG_HEADERS = (updatedAt: string, shapes: number): HeadersInit => ({
  'Content-Type': 'image/png',
  'Cache-Control': 'no-store',
  'X-Canvas-Updated-At': updatedAt,
  'X-Canvas-Shapes': String(shapes),
});

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
      const info: CanvasInfoResponse = {
        vendor: `quickdraw@${vendorVersion()}`,
        peers: boardHub.connectionCount,
        shapes: boardHub.shapeCount,
        updatedAt: boardHub.updatedAt,
        hasFrame: boardHub.frame !== null,
      };
      return json(info);
    }

    // Snapshot + textos — leitura precisa para IAs (sem precisar de visão).
    if (req.method === 'GET' && pathname === '/canvas/snapshot') {
      const res: CanvasSnapshotResponse = {
        snapshot: boardHub.getSnapshot(),
        texts: boardHub.texts,
        shapes: boardHub.shapeCount,
        updatedAt: boardHub.updatedAt,
      };
      return json(res);
    }

    // Frame PNG — os olhos da IA (visão). 404 se nenhum viewer enviou ainda.
    if (req.method === 'GET' && pathname === '/canvas/frame.png') {
      const frame = boardHub.frame;
      if (!frame) return json({ error: 'no_frame_yet' }, 404);
      return new Response(frame.bytes, {
        status: 200,
        headers: PNG_HEADERS(frame.updatedAt, boardHub.shapeCount),
      });
    }

    // Viewers enviam o frame renderizado (debounce no cliente).
    if (req.method === 'POST' && pathname === '/canvas/frame') {
      return handleFrameUpload(req);
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

// ── Upload de frame PNG por um viewer ──

async function handleFrameUpload(req: Request): Promise<Response> {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/png')) {
    return json({ error: 'unsupported_media_type' }, 415);
  }
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await req.arrayBuffer());
  } catch {
    return json({ error: 'read_error' }, 400);
  }
  const err = validateFrame(bytes);
  if (err) {
    const status = err === 'frame excede 8MB' ? 413 : 400;
    return json({ error: 'invalid_frame', message: err }, status);
  }
  const updatedAt = boardHub.setFrame(bytes);
  const res: CanvasFrameResponse = { ok: true, bytes: bytes.length, updatedAt };
  return json(res);
}

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
