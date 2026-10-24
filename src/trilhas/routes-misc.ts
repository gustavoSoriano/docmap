import { loadGuardrails, loadTrilhaDetail } from './detail.ts';
import { buildContextPack } from './context.ts';
import { autoLayout, LAYOUT } from './layout.ts';
import { getNode, listNodes, moveNodes } from './nodes.ts';
import { listEdges } from './edges.ts';
import { listStickies, updateSticky } from './stickies.ts';
import { getTrilha } from './store.ts';
import { logEvent, watchTrilha } from './events.ts';
import { getMacroByRef } from '../macros/store.ts';
import { invokeMacro } from '../macros/runner.ts';
import { badRequest, json, notFound } from '../server/response.ts';

const API = 'http://127.0.0.1:3334';
const OUTPUT_CAP = 20_000;
const enc = new TextEncoder();

type MacroRunBody = { input?: string; nodeId?: string; by?: string };

const readBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
};

const oneLine = (text: string, max: number): string =>
  text.replace(/\s+/g, ' ').trim().slice(0, max);

const contextRoute = async (kv: Deno.Kv, url: URL, id: string) => {
  const detail = await loadTrilhaDetail(kv, id);
  if (!detail) return notFound();
  const nodeId = url.searchParams.get('node');
  const node = nodeId ? detail.nodes.find((n) => n.id === nodeId) : undefined;
  if (nodeId && !node) return notFound();
  const guardrails = await loadGuardrails(kv, detail);
  const markdown = buildContextPack({ detail, guardrails, node, api: API });
  if (url.searchParams.get('format') === 'json') {
    return json({
      markdown,
      guardrails: guardrails.map((g) => g.title),
      detail,
    });
  }
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};

// Stickers não entram no grafo: vão para uma fileira abaixo de todos os blocos,
// para a reorganização nunca deixá-los por cima de um cartão.
const tuckStickies = async (
  kv: Deno.Kv,
  id: string,
  positions: ReadonlyMap<string, { x: number; y: number }>,
  heights: ReadonlyMap<string, number>,
): Promise<void> => {
  let bottom: number = LAYOUT.originY;
  for (const [nodeId, p] of positions) {
    bottom = Math.max(bottom, p.y + (heights.get(nodeId) ?? LAYOUT.nodeH));
  }
  const stickies = await listStickies(kv, id);
  for (const [i, sticky] of stickies.entries()) {
    await updateSticky(kv, sticky.id, {
      position: {
        x: LAYOUT.originX + (i % 5) * 220,
        y: bottom + 70 + Math.floor(i / 5) * 190,
      },
    });
  }
};

const layoutRoute = async (kv: Deno.Kv, req: Request, id: string) => {
  const [nodes, edges] = await Promise.all([
    listNodes(kv, id),
    listEdges(kv, id),
  ]);
  const body = (await readBody(req) ?? {}) as {
    heights?: Record<string, number>;
  };
  const heights = new Map(
    Object.entries(body.heights ?? {}).filter(([, h]) => Number.isFinite(h)),
  );
  const positions = autoLayout(nodes, edges, heights);
  const moved = await moveNodes(kv, positions);
  await tuckStickies(kv, id, positions, heights);
  await logEvent(kv, id, 'layout.applied', { detail: `${moved} blocos` });
  return json({ moved });
};

const macroRunRoute = async (
  kv: Deno.Kv,
  req: Request,
  id: string,
  ref: string,
) => {
  const macro = await getMacroByRef(kv, ref);
  if (!macro) return json({ error: 'macro_not_found', reference: ref }, 404);
  const body = (await readBody(req) ?? {}) as MacroRunBody;
  const nodeId =
    body.nodeId && (await getNode(kv, body.nodeId))?.trilhaId === id
      ? body.nodeId
      : undefined;
  const result = await invokeMacro(macro, { input: body.input });
  if (result.blocked) {
    return json({ ok: false, blocked: true, reason: result.reason }, 403);
  }
  const output = (result.stdout + result.stderr).slice(0, OUTPUT_CAP);
  const ok = result.code === 0;
  await logEvent(kv, id, 'macro.run', {
    ...(nodeId ? { nodeId } : {}),
    nodeTitle: macro.title,
    ...(body.by ? { by: body.by } : {}),
    detail: `${ok ? 'ok' : `erro ${result.code}`}: ${oneLine(output, 160)}`,
  });
  return json({ ok, code: result.code, output, macro: macro.title });
};

// SSE sem payload: só avisa "mudou". A UI refaz o GET do detalhe (fonte única).
const streamRoute = (id: string): Response => {
  let off: (() => void) | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(enc.encode(chunk));
        } catch {
          off?.();
          clearInterval(ping);
        }
      };
      send('retry: 3000\n: ok\n\n');
      off = watchTrilha(id, () => send('event: change\ndata: {}\n\n'));
      ping = setInterval(() => send(': ping\n\n'), 20_000);
    },
    cancel() {
      off?.();
      clearInterval(ping);
    },
  });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
};

// context, layout, macros/:ref/run, stream
export const miscRoutes = async (
  kv: Deno.Kv,
  req: Request,
  url: URL,
  id: string,
  sub: string,
  subId?: string,
  action?: string,
): Promise<Response | null> => {
  const known = ['context', 'layout', 'macros', 'stream'];
  if (!known.includes(sub)) return null;
  if (!(await getTrilha(kv, id))) return notFound();
  if (sub === 'context' && req.method === 'GET') {
    return contextRoute(kv, url, id);
  }
  if (sub === 'stream' && req.method === 'GET') return streamRoute(id);
  if (sub === 'layout' && req.method === 'POST') {
    return layoutRoute(kv, req, id);
  }
  if (sub === 'macros' && subId && action === 'run' && req.method === 'POST') {
    return macroRunRoute(kv, req, id, subId);
  }
  return badRequest('unsupported');
};
