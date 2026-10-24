import {
  createRef,
  deleteRef,
  getRef,
  isRefKind,
  isRefRole,
  listRefs,
} from './refs.ts';
import { getNode } from './nodes.ts';
import { loadTarget, resolveRefs } from './targets.ts';
import { buildArsenal } from './arsenal.ts';
import { getTrilha } from './store.ts';
import { logEvent } from './events.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import type { CreateRefInput } from './types.ts';

const readBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
};

// /trilhas/:id/refs[/:refId] e /trilhas/:id/arsenal
export const refsRoutes = async (
  kv: Deno.Kv,
  req: Request,
  url: URL,
  id: string,
  sub: string,
  subId?: string,
): Promise<Response | null> => {
  if (sub === 'arsenal' && req.method === 'GET') {
    const trilha = await getTrilha(kv, id);
    if (!trilha) return notFound();
    const refs = await listRefs(kv, id);
    return json(
      await buildArsenal(kv, trilha, refs, url.searchParams.get('q') ?? ''),
    );
  }
  if (sub !== 'refs') return null;
  if (!(await getTrilha(kv, id))) return notFound();

  if (req.method === 'GET' && !subId) {
    return json(await resolveRefs(kv, await listRefs(kv, id)));
  }
  if (req.method === 'POST' && !subId) {
    const input = await readBody(req) as CreateRefInput | undefined;
    if (!input || !isRefKind(input.kind) || !input.targetId) {
      return badRequest(
        'kind (note|skill|macro|podcast|favorite) and targetId required',
      );
    }
    if (input.role !== undefined && !isRefRole(input.role)) {
      return badRequest('role must be guardrail or context');
    }
    const meta = await loadTarget(kv, input.kind, input.targetId);
    if (!meta) return badRequest(`${input.kind} not found: ${input.targetId}`);
    if (input.nodeId) {
      const node = await getNode(kv, input.nodeId);
      if (!node || node.trilhaId !== id) {
        return badRequest('nodeId not in trilha');
      }
    }
    const { ref, created } = await createRef(kv, id, input);
    if (created) {
      await logEvent(kv, id, 'ref.added', {
        ...(ref.nodeId ? { nodeId: ref.nodeId } : {}),
        nodeTitle: meta.title,
        detail: ref.kind,
      });
    }
    const [resolved] = await resolveRefs(kv, [ref]);
    return json(resolved, created ? 201 : 200);
  }
  if (req.method === 'DELETE' && subId) {
    const ref = await getRef(kv, subId);
    if (!ref || ref.trilhaId !== id) return notFound();
    await deleteRef(kv, subId);
    const meta = await loadTarget(kv, ref.kind, ref.targetId);
    await logEvent(kv, id, 'ref.removed', {
      ...(ref.nodeId ? { nodeId: ref.nodeId } : {}),
      nodeTitle: meta?.title ?? ref.kind,
      detail: ref.kind,
    });
    return json({ ok: true });
  }
  return json({ error: 'method_not_allowed' }, 405);
};
