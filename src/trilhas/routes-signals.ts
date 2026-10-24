import {
  createSignal,
  deleteSignal,
  getSignal,
  isSignalKind,
  listSignals,
  reopenSignal,
  resolveSignal,
} from './signals.ts';
import { forceNodeStatus, getNode } from './nodes.ts';
import { getTrilha } from './store.ts';
import { logEvent } from './events.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import type { CreateSignalInput, ResolveSignalInput } from './types.ts';

type SignalPatch = ResolveSignalInput & { readonly status?: string };

const readBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
};

// Bloqueio aberto em um bloco o marca como bloqueado; quando o último
// bloqueio é resolvido, o bloco volta a andar (fazendo se há dono, senão a fazer).
const syncBlockedStatus = async (
  kv: Deno.Kv,
  trilhaId: string,
  nodeId: string,
  reasonIfBlocking?: string,
): Promise<void> => {
  const node = await getNode(kv, nodeId);
  if (!node || node.trilhaId !== trilhaId || node.status === 'done') return;
  if (reasonIfBlocking) {
    await forceNodeStatus(kv, nodeId, 'blocked', reasonIfBlocking);
    return;
  }
  const stillOpen = (await listSignals(kv, trilhaId)).some((s) =>
    s.nodeId === nodeId && s.kind === 'blocker' && s.status === 'open'
  );
  if (!stillOpen && node.status === 'blocked') {
    await forceNodeStatus(kv, nodeId, node.claimedBy ? 'doing' : 'todo');
  }
};

// /trilhas/:id/signals[/:signalId]
export const signalsRoutes = async (
  kv: Deno.Kv,
  req: Request,
  id: string,
  sub: string,
  subId?: string,
): Promise<Response | null> => {
  if (sub !== 'signals') return null;
  if (!(await getTrilha(kv, id))) return notFound();

  if (req.method === 'GET' && !subId) return json(await listSignals(kv, id));

  if (req.method === 'POST' && !subId) {
    const input = await readBody(req) as CreateSignalInput | undefined;
    if (!input || !isSignalKind(input.kind) || !input.text?.trim()) {
      return badRequest(
        'kind (blocker|warning|question|pending) and text required',
      );
    }
    if (input.nodeId) {
      const node = await getNode(kv, input.nodeId);
      if (!node || node.trilhaId !== id) {
        return badRequest('nodeId not in trilha');
      }
    }
    const signal = await createSignal(kv, id, input);
    if (signal.kind === 'blocker' && signal.nodeId) {
      await syncBlockedStatus(kv, id, signal.nodeId, signal.text);
    }
    const node = signal.nodeId ? await getNode(kv, signal.nodeId) : null;
    await logEvent(kv, id, 'signal.created', {
      ...(signal.nodeId ? { nodeId: signal.nodeId } : {}),
      ...(node ? { nodeTitle: node.title } : {}),
      ...(signal.by ? { by: signal.by } : {}),
      detail: `${signal.kind}: ${signal.text.slice(0, 120)}`,
    });
    return json(signal, 201);
  }

  if (!subId) return json({ error: 'method_not_allowed' }, 405);
  const current = await getSignal(kv, subId);
  if (!current || current.trilhaId !== id) return notFound();

  if (req.method === 'PUT') {
    const body = await readBody(req) as SignalPatch | undefined;
    if (!body) return badRequest('Invalid JSON');
    const reopen = body.status === 'open';
    const updated = reopen
      ? await reopenSignal(kv, subId)
      : await resolveSignal(kv, subId, body.resolution, body.by);
    if (current.kind === 'blocker' && current.nodeId) {
      await syncBlockedStatus(
        kv,
        id,
        current.nodeId,
        reopen ? current.text : undefined,
      );
    }
    const node = current.nodeId ? await getNode(kv, current.nodeId) : null;
    await logEvent(kv, id, reopen ? 'signal.reopened' : 'signal.resolved', {
      ...(current.nodeId ? { nodeId: current.nodeId } : {}),
      ...(node ? { nodeTitle: node.title } : {}),
      ...(body.by ? { by: body.by } : {}),
      detail: `${current.kind}: ${current.text.slice(0, 120)}`,
    });
    return json(updated);
  }

  if (req.method === 'DELETE') {
    await deleteSignal(kv, subId);
    if (current.kind === 'blocker' && current.nodeId) {
      await syncBlockedStatus(kv, id, current.nodeId);
    }
    return json({ ok: true });
  }
  return json({ error: 'method_not_allowed' }, 405);
};
