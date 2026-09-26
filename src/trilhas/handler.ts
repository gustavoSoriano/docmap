import {
  createTrilha,
  deleteTrilha,
  getTrilha,
  listTrilhas,
  updateTrilha,
} from './store.ts';
import {
  claimNode,
  createNode,
  deleteNode,
  getNode,
  heartbeatNode,
  isNodeStatus,
  isStaleClaim,
  listNodes,
  releaseNode,
  updateNode,
  deleteNodesOfTrilha,
} from './nodes.ts';
import {
  createEdge,
  deleteEdge,
  deleteEdgesOfNode,
  deleteEdgesOfTrilha,
  listEdges,
} from './edges.ts';
import {
  createSticky,
  deleteStickiesOfTrilha,
  deleteSticky,
  getSticky,
  isStickyColor,
  listStickies,
  updateSticky,
} from './stickies.ts';
import {
  deleteEventsOfTrilha,
  listEvents,
  logEvent,
} from './events.ts';
import { badRequest, conflict, json, notFound } from '../server/response.ts';
import type {
  Assignee,
  ClaimInput,
  CreateEdgeInput,
  CreateNodeInput,
  CreateStickyInput,
  CreateTrilhaInput,
  HeartbeatInput,
  UpdateNodeInput,
  UpdateStickyInput,
  UpdateTrilhaInput,
} from './types.ts';

const deepLink = (id: string): string =>
  `http://127.0.0.1:3333/#trilha/${id}`;

const readBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
};

const validAssignee = (value: unknown): value is Assignee => {
  if (!value || typeof value !== 'object') return false;
  const a = value as Record<string, unknown>;
  return (a.kind === 'human' || a.kind === 'ai') &&
    typeof a.label === 'string' && !!a.label.trim();
};

const nodeTrilhaOf = (kv: Deno.Kv) =>
  async (id: string): Promise<string | null> => {
    const node = await getNode(kv, id);
    return node ? node.trilhaId : null;
  };

export const trilhasHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/trilhas\/?/, '').split('/')
      .filter(Boolean);

    if (req.method === 'GET' && segments.length === 0) {
      const items = await listTrilhas(kv);
      const withCounts = await Promise.all(items.map(async (t) => ({
        ...t,
        nodeCount: (await listNodes(kv, t.id)).length,
        deepLink: deepLink(t.id),
      })));
      return json(withCounts);
    }

    if (req.method === 'POST' && segments.length === 0) {
      const input = await readBody(req) as CreateTrilhaInput | undefined;
      if (!input || !input.title?.trim() || !input.objective?.trim()) {
        return badRequest('title and objective required');
      }
      const trilha = await createTrilha(kv, input);
      await logEvent(kv, trilha.id, 'trilha.created');
      return json({ ...trilha, deepLink: deepLink(trilha.id) }, 201);
    }

    const [id, sub, subId] = segments;

    if (segments.length === 1 && sub !== 'nodes' && sub !== 'edges') {
      if (req.method === 'GET') {
        const trilha = await getTrilha(kv, id);
        if (!trilha) return notFound();
        const [nodes, edges, stickies] = await Promise.all([
          listNodes(kv, id),
          listEdges(kv, id),
          listStickies(kv, id),
        ]);
        return json({
          trilha: { ...trilha, deepLink: deepLink(id) },
          nodes,
          edges,
          stickies,
        });
      }
      if (req.method === 'PUT') {
        const body = await readBody(req) as UpdateTrilhaInput;
        const before = await getTrilha(kv, id);
        const updated = await updateTrilha(kv, id, body);
        if (!updated) return notFound();
        await logEvent(kv, id, 'trilha.updated', {
          detail: body.status && body.status !== before?.status
            ? `status → ${body.status}`
            : 'metadados',
        });
        return json({ ...updated, deepLink: deepLink(id) });
      }
      if (req.method === 'DELETE') {
        const ok = await deleteTrilha(kv, id);
        if (!ok) return notFound();
        await Promise.all([
          deleteNodesOfTrilha(kv, id),
          deleteEdgesOfTrilha(kv, id),
          deleteStickiesOfTrilha(kv, id),
          deleteEventsOfTrilha(kv, id),
        ]);
        return json({ ok: true });
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (sub === 'nodes' && !subId) {
      const trilha = await getTrilha(kv, id);
      if (!trilha) return notFound();
      if (req.method === 'GET') return json(await listNodes(kv, id));
      if (req.method === 'POST') {
        const input = await readBody(req) as CreateNodeInput | undefined;
        if (!input || !input.title?.trim()) {
          return badRequest('title required');
        }
        if (input.status !== undefined && !isNodeStatus(input.status)) {
          return badRequest('invalid status');
        }
        if (input.assignee !== undefined && !validAssignee(input.assignee)) {
          return badRequest('assignee must be { kind: human|ai, label }');
        }
        const existing = await listNodes(kv, id);
        const node = await createNode(kv, id, input, existing.length);
        await logEvent(kv, id, 'node.created', {
          nodeId: node.id,
          nodeTitle: node.title,
        });
        if (input.dependsOn?.length) {
          for (const depId of input.dependsOn) {
            const { error } = await createEdge(
              kv,
              id,
              depId,
              node.id,
              nodeTrilhaOf(kv),
            );
            if (error) {
              await deleteNode(kv, node.id);
              return badRequest(`dependsOn invalid: ${error} (${depId})`);
            }
            const dep = await getNode(kv, depId);
            await logEvent(kv, id, 'edge.created', {
              nodeId: node.id,
              nodeTitle: node.title,
              detail: `${dep?.title ?? depId} → ${node.title}`,
            });
          }
        }
        return json(node, 201);
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (sub === 'nodes' && subId && segments[3] && req.method === 'POST') {
      const action = segments[3];
      const current = await getNode(kv, subId);
      if (!current || current.trilhaId !== id) return notFound();
      if (action === 'claim') {
        const body = await readBody(req) as ClaimInput | undefined;
        if (!body?.by?.trim()) return badRequest('by required');
        const force = body.force === true;
        const by = body.by.trim();
        const takeover = force && !!current.claimedBy &&
          current.claimedBy !== by;
        const { node, error, claimedBy } = await claimNode(
          kv,
          subId,
          body.by,
          force,
        );
        if (error === 'not_found') return notFound();
        if (error === 'claimed') {
          return conflict(`node claimed by ${claimedBy}`);
        }
        await logEvent(kv, id, takeover ? 'node.takeover' : 'node.claim', {
          nodeId: subId,
          nodeTitle: current.title,
          by,
          ...(takeover ? { detail: `de ${current.claimedBy}` } : {}),
        });
        return json(node);
      }
      if (action === 'release') {
        const node = await releaseNode(kv, subId);
        if (!node) return notFound();
        await logEvent(kv, id, 'node.release', {
          nodeId: subId,
          nodeTitle: current.title,
        });
        return json(node);
      }
      if (action === 'heartbeat') {
        const body = await readBody(req) as HeartbeatInput | undefined;
        if (!body?.by?.trim()) return badRequest('by required');
        const { node, error, claimedBy } = await heartbeatNode(
          kv,
          subId,
          body.by,
        );
        if (error === 'not_found') return notFound();
        if (error === 'claimed') {
          return conflict(`node claimed by ${claimedBy}`);
        }
        return json(node);
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (sub === 'nodes' && subId) {
      if (req.method === 'GET') {
        const node = await getNode(kv, subId);
        if (!node || node.trilhaId !== id) return notFound();
        return json(node);
      }
      if (req.method === 'PUT') {
        const input = await readBody(req) as UpdateNodeInput | undefined;
        if (!input) return badRequest('Invalid JSON');
        if (input.status !== undefined && !isNodeStatus(input.status)) {
          return badRequest('invalid status');
        }
        if (input.assignee !== undefined && !validAssignee(input.assignee)) {
          return badRequest('assignee must be { kind: human|ai, label }');
        }
        const current = await getNode(kv, subId);
        if (!current || current.trilhaId !== id) return notFound();
        const { node, error, claimedBy } = await updateNode(kv, subId, input);
        if (error === 'not_found') return notFound();
        if (error === 'claimed') {
          return conflict(`node claimed by ${claimedBy}`);
        }
        if (error === 'stale') {
          return conflict('node changed by someone else — reload first');
        }
        if (error === 'done_needs_result') {
          return badRequest(
            'done requires a result when the node has doneCriteria',
          );
        }
        const by = input.by?.trim();
        if (input.status !== undefined && input.status !== current.status) {
          await logEvent(kv, id, 'node.status', {
            nodeId: subId,
            nodeTitle: current.title,
            ...(by ? { by } : {}),
            detail: `${current.status} → ${input.status}`,
          });
        } else if (input.result !== undefined) {
          await logEvent(kv, id, 'node.result', {
            nodeId: subId,
            nodeTitle: current.title,
            ...(by ? { by } : {}),
          });
        } else {
          await logEvent(kv, id, 'node.updated', {
            nodeId: subId,
            nodeTitle: current.title,
            ...(by ? { by } : {}),
          });
        }
        return json(node);
      }
      if (req.method === 'DELETE') {
        const current = await getNode(kv, subId);
        if (!current || current.trilhaId !== id) return notFound();
        await deleteEdgesOfNode(kv, id, subId);
        await deleteNode(kv, subId);
        return json({ ok: true });
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (sub === 'stickies' && !subId) {
      const trilha = await getTrilha(kv, id);
      if (!trilha) return notFound();
      if (req.method === 'GET') return json(await listStickies(kv, id));
      if (req.method === 'POST') {
        const input = await readBody(req) as CreateStickyInput | undefined;
        if (!input || !input.text?.trim()) {
          return badRequest('text required');
        }
        if (input.color !== undefined && !isStickyColor(input.color)) {
          return badRequest('invalid color');
        }
        const existing = await listStickies(kv, id);
        const sticky = await createSticky(kv, id, input, existing.length);
        await logEvent(kv, id, 'sticky.created', {
          nodeId: sticky.id,
          nodeTitle: sticky.text.slice(0, 80),
        });
        return json(sticky, 201);
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (sub === 'stickies' && subId) {
      if (req.method === 'GET') {
        const sticky = await getSticky(kv, subId);
        if (!sticky || sticky.trilhaId !== id) return notFound();
        return json(sticky);
      }
      if (req.method === 'PUT') {
        const input = await readBody(req) as UpdateStickyInput | undefined;
        if (!input) return badRequest('Invalid JSON');
        if (
          input.color !== undefined && !isStickyColor(input.color)
        ) {
          return badRequest('invalid color');
        }
        const current = await getSticky(kv, subId);
        if (!current || current.trilhaId !== id) return notFound();
        if (input.text !== undefined && !input.text.trim()) {
          return badRequest('text required');
        }
        const sticky = await updateSticky(kv, subId, input);
        await logEvent(kv, id, 'sticky.updated', {
          nodeId: subId,
          nodeTitle: (sticky?.text ?? current.text).slice(0, 80),
        });
        return json(sticky);
      }
      if (req.method === 'DELETE') {
        const current = await getSticky(kv, subId);
        if (!current || current.trilhaId !== id) return notFound();
        await deleteSticky(kv, subId);
        await logEvent(kv, id, 'sticky.removed', {
          nodeId: subId,
          nodeTitle: current.text.slice(0, 80),
        });
        return json({ ok: true });
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (sub === 'next' && !subId && req.method === 'GET') {
      const trilha = await getTrilha(kv, id);
      if (!trilha) return notFound();
      const by = url.searchParams.get('by')?.trim() || undefined;
      const allNodes = await listNodes(kv, id);
      const allEdges = await listEdges(kv, id);
      const doneSet = new Set(
        allNodes.filter((n) => n.status === 'done').map((n) => n.id),
      );
      for (const candidate of allNodes) {
        if (candidate.status !== 'todo') continue;
        const deps = allEdges.filter((e) => e.toNodeId === candidate.id);
        if (!deps.every((d) => doneSet.has(d.fromNodeId))) continue;
        if (!by) return json({ node: candidate, claimed: false });
        if (
          candidate.claimedBy && candidate.claimedBy !== by &&
          !isStaleClaim(candidate)
        ) continue;
        const wasTakeover = !!candidate.claimedBy &&
          candidate.claimedBy !== by;
        const r = await claimNode(kv, candidate.id, by, true);
        if (r.error) continue;
        await logEvent(
          kv,
          id,
          wasTakeover ? 'node.takeover' : 'node.claim',
          {
            nodeId: candidate.id,
            nodeTitle: candidate.title,
            by,
            detail: 'via next',
          },
        );
        return json({ node: r.node, claimed: true });
      }
      return json({ error: 'no_work' }, 404);
    }

    if (sub === 'events' && !subId && req.method === 'GET') {
      const trilha = await getTrilha(kv, id);
      if (!trilha) return notFound();
      const raw = Number(url.searchParams.get('limit') ?? 100);
      const limit = Math.max(1, Math.min(Number.isFinite(raw) ? raw : 100, 500));
      return json(await listEvents(kv, id, limit));
    }

    if (sub === 'edges' && !subId) {
      const trilha = await getTrilha(kv, id);
      if (!trilha) return notFound();
      if (req.method === 'GET') return json(await listEdges(kv, id));
      if (req.method === 'POST') {
        const input = await readBody(req) as CreateEdgeInput | undefined;
        if (!input?.fromNodeId || !input?.toNodeId) {
          return badRequest('fromNodeId and toNodeId required');
        }
        const { edge, error } = await createEdge(
          kv,
          id,
          input.fromNodeId,
          input.toNodeId,
          nodeTrilhaOf(kv),
        );
        if (!edge) {
          if (error === 'cycle') {
            return conflict('edge would create a cycle');
          }
          return badRequest(`invalid edge: ${error}`);
        }
        const [fromNode, toNode] = await Promise.all([
          getNode(kv, input.fromNodeId),
          getNode(kv, input.toNodeId),
        ]);
        if (fromNode && toNode) {
          await logEvent(kv, id, 'edge.created', {
            nodeId: toNode.id,
            nodeTitle: toNode.title,
            detail: `${fromNode.title} → ${toNode.title}`,
          });
        }
        return json(edge, 201);
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (sub === 'edges' && subId) {
      if (req.method === 'DELETE') {
        const edge = await deleteEdge(kv, subId);
        if (!edge || edge.trilhaId !== id) return notFound();
        const [fromNode, toNode] = await Promise.all([
          getNode(kv, edge.fromNodeId),
          getNode(kv, edge.toNodeId),
        ]);
        if (fromNode && toNode) {
          await logEvent(kv, id, 'edge.removed', {
            nodeId: toNode.id,
            nodeTitle: toNode.title,
            detail: `${fromNode.title} → ${toNode.title}`,
          });
        }
        return json({ ok: true });
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    return notFound();
  };
