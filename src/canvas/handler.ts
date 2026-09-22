import { serveCanvasPage } from './page.ts';
import { boardHub, validateDiff, validateFrame } from './hub.ts';
import { createLibraryHandler } from './library-handler.ts';
import {
  createProposal,
  dismissProposal,
  getProposal,
  listProposalNotices,
} from './proposals.ts';
import { validateShapeInputs } from './shapes.ts';
import {
  appendShapesToDrawing,
  createDrawingFromRecords,
  ensureDefaultCollection,
  getCollection,
} from './store.ts';
import { isVendorFile, serveVendorFile, vendorVersion } from './vendor.ts';
import { json } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';
import type {
  BoardDiff,
  CanvasFrameResponse,
  CanvasInfoResponse,
  CanvasShapesResponse,
  CanvasSnapshotResponse,
  ClientMessage,
  ProposalApplyResponse,
  ProposalCreateResponse,
} from './types.ts';

const VENDOR_PREFIX = '/canvas/vendor/quickdraw/';

const PNG_HEADERS = (updatedAt: string, shapes: number): HeadersInit => ({
  'Content-Type': 'image/png',
  'Cache-Control': 'no-store',
  'X-Canvas-Updated-At': updatedAt,
  'X-Canvas-Shapes': String(shapes),
});

export const createCanvasHandler = (deps: HandlerDeps) => {
  const library = createLibraryHandler(deps);

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

    // IA desenha: shapes de alto nível viram records + broadcast.
    if (req.method === 'POST' && pathname === '/canvas/shapes') {
      return handleShapes(req);
    }

    if (pathname === '/canvas/ws') {
      return handleWebSocket(req);
    }

    if (req.method === 'POST' && pathname === '/canvas/clear') {
      boardHub.clearBoard();
      return json({ ok: true, connections: boardHub.connectionCount });
    }

    // Propostas da IA (Fase 3: consentimento — nada entra no live sem Aplicar).
    if (
      pathname === '/canvas/proposals' ||
      pathname.startsWith('/canvas/proposals/')
    ) {
      return handleProposals(deps, req, url);
    }

    // IA isolada num desenho salvo (Fase 3: sem tocar no board ao vivo).
    // POST /canvas/drawings/:id/shapes — intercepta antes da biblioteca.
    if (
      req.method === 'POST' &&
      /^\/canvas\/drawings\/[^/]+\/shapes$/.test(pathname)
    ) {
      const drawingId = pathname.split('/')[3] ?? '';
      return handleDrawingShapes(deps, req, drawingId);
    }

    // Biblioteca: /canvas/collections… e /canvas/drawings…
    if (
      pathname === '/canvas/collections' ||
      pathname.startsWith('/canvas/collections/')
    ) {
      return library(req, url);
    }
    if (
      pathname === '/canvas/drawings' ||
      pathname.startsWith('/canvas/drawings/')
    ) {
      return library(req, url);
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

// ── IA desenha: shapes de alto nível → records → broadcast ──

async function handleShapes(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const parsed = validateShapeInputs(body);
  if ('error' in parsed) {
    return json({ error: 'invalid_shapes', message: parsed.error }, 400);
  }
  const ids = boardHub.insertShapes(parsed.shapes);
  const res: CanvasShapesResponse = { ok: true, ids, count: ids.length };
  return json(res);
}

// ── Propostas da IA (Fase 3) ──

const readJsonBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return null;
  }
};

const cleanLabel = (v: unknown): string => {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, 120);
};

async function handleProposals(
  deps: HandlerDeps,
  req: Request,
  url: URL,
): Promise<Response> {
  const { kv } = deps;
  const seg = url.pathname.replace(/^\/canvas\/proposals\/?/, '')
    .split('/')
    .filter(Boolean);
  const [id, action] = seg;

  // GET /canvas/proposals — pendências (avisos leves, sem records).
  if (req.method === 'GET' && !id) {
    return json(listProposalNotices());
  }

  // POST /canvas/proposals { shapes, label? } — segura sem tocar no live.
  if (req.method === 'POST' && !id) {
    const body = await readJsonBody(req);
    const parsed = validateShapeInputs(body);
    if ('error' in parsed) {
      return json({ error: 'invalid_shapes', message: parsed.error }, 400);
    }
    const label = body && typeof body === 'object' && !Array.isArray(body)
      ? cleanLabel((body as Record<string, unknown>).label)
      : '';
    const proposal = createProposal(
      parsed.shapes,
      boardHub.getSnapshot().document.store,
      label,
    );
    boardHub.notifyProposal({
      id: proposal.id,
      label: proposal.label,
      count: proposal.records.length,
      createdAt: proposal.createdAt,
    });
    const res: ProposalCreateResponse = {
      ok: true,
      proposal: {
        id: proposal.id,
        label: proposal.label,
        count: proposal.records.length,
        createdAt: proposal.createdAt,
      },
    };
    return json(res, 201);
  }

  if (!id) return json({ error: 'method_not_allowed' }, 405);

  // POST /canvas/proposals/:id/apply — humano consentiu: entra no live.
  if (req.method === 'POST' && action === 'apply') {
    const proposal = getProposal(id);
    if (!proposal) return json({ error: 'not_found' }, 404);
    const ids = boardHub.insertRecords(proposal.records);
    dismissProposal(id);
    boardHub.notifyProposalRetracted(id);
    const res: ProposalApplyResponse = { ok: true, ids, count: ids.length };
    return json(res);
  }

  // POST /canvas/proposals/:id/save { name?, collectionId?, tags? } —
  // vira desenho novo isolado (sem tocar no live).
  if (req.method === 'POST' && action === 'save') {
    const proposal = getProposal(id);
    if (!proposal) return json({ error: 'not_found' }, 404);
    const body = await readJsonBody(req);
    const rec = body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
    const rawName = typeof rec.name === 'string' ? rec.name.trim() : '';
    const name = (rawName || proposal.label || 'Proposta da IA').slice(0, 120);
    if (!name) return json({ error: 'name required (1-120 chars)' }, 400);
    const col = typeof rec.collectionId === 'string' && rec.collectionId
      ? await getCollection(kv, rec.collectionId)
      : await ensureDefaultCollection(kv);
    if (!col) return json({ error: 'not_found' }, 404);
    const meta = await createDrawingFromRecords(kv, {
      collectionId: col.id,
      name,
      tags: Array.isArray(rec.tags) ? rec.tags.map(String) : undefined,
      records: proposal.records,
    });
    if (!meta) return json({ error: 'invalid_snapshot' }, 400);
    dismissProposal(id);
    boardHub.notifyProposalRetracted(id);
    return json(meta, 201);
  }

  // DELETE /canvas/proposals/:id ou POST .../dismiss — descarta.
  if (
    (req.method === 'DELETE' && !action) ||
    (req.method === 'POST' && action === 'dismiss')
  ) {
    const proposal = getProposal(id);
    if (!proposal) return json({ error: 'not_found' }, 404);
    dismissProposal(id);
    boardHub.notifyProposalRetracted(id);
    return json({ ok: true });
  }

  return json({ error: 'method_not_allowed' }, 405);
}

// ── IA num desenho salvo (Fase 3: isolado do live) ──

async function handleDrawingShapes(
  deps: HandlerDeps,
  req: Request,
  drawingId: string,
): Promise<Response> {
  const { kv } = deps;
  const body = await readJsonBody(req);
  const parsed = validateShapeInputs(body);
  if ('error' in parsed) {
    return json({ error: 'invalid_shapes', message: parsed.error }, 400);
  }
  const result = await appendShapesToDrawing(kv, drawingId, parsed.shapes);
  if (!result) return json({ error: 'not_found' }, 404);
  return json({
    ok: true,
    ids: result.ids,
    count: result.ids.length,
    shapes: result.meta.shapes,
  });
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
