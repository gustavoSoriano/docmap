// ════ Fila de atenção e saúde — funções puras, derivadas do estado ════
// Nada aqui é persistido: a mesma trilha sempre produz a mesma fila.
// Só sobe para a fila o que exige olhar humano (bloqueio, pergunta,
// pendência, aviso, trava sem sinal).

import { isStaleClaim } from './nodes.ts';
import type {
  AttentionItem,
  SignalKind,
  TrilhaEdge,
  TrilhaHealth,
  TrilhaNode,
  TrilhaSignal,
} from './types.ts';

const RANK: Readonly<Record<string, number>> = {
  blocker: 0,
  question: 1,
  pending: 2,
  warning: 3,
  stale: 4,
};

// Bloco a fazer cujas dependências estão todas prontas (mesma regra do /next).
export const readyNodes = (
  nodes: readonly TrilhaNode[],
  edges: readonly TrilhaEdge[],
): TrilhaNode[] => {
  const done = new Set(
    nodes.filter((n) => n.status === 'done').map((n) => n.id),
  );
  return nodes.filter((n) =>
    n.status === 'todo' &&
    edges.filter((e) => e.toNodeId === n.id).every((e) =>
      done.has(e.fromNodeId)
    )
  );
};

const fromSignal = (s: TrilhaSignal): AttentionItem => ({
  id: `signal:${s.id}`,
  kind: s.kind,
  source: 'signal',
  ...(s.nodeId ? { nodeId: s.nodeId } : {}),
  signalId: s.id,
  text: s.text,
  ...(s.by ? { by: s.by } : {}),
  at: s.createdAt,
});

export const buildAttention = (
  nodes: readonly TrilhaNode[],
  edges: readonly TrilhaEdge[],
  signals: readonly TrilhaSignal[],
  now = Date.now(),
): AttentionItem[] => {
  const open = signals.filter((s) => s.status === 'open');
  const items: AttentionItem[] = open.map(fromSignal);
  const hasBlockerSignal = new Set(
    open.filter((s) => s.kind === 'blocker' && s.nodeId).map((s) => s.nodeId),
  );
  for (const node of nodes) {
    if (node.status === 'blocked' && !hasBlockerSignal.has(node.id)) {
      items.push({
        id: `node:${node.id}:blocked`,
        kind: 'blocker',
        source: 'node',
        nodeId: node.id,
        text: node.blockedReason?.trim() || node.title,
        at: node.updatedAt,
      });
    }
    if (node.status !== 'done' && isStaleClaim(node, now)) {
      items.push({
        id: `node:${node.id}:stale`,
        kind: 'stale',
        source: 'claim',
        nodeId: node.id,
        text: node.title,
        ...(node.claimedBy ? { by: node.claimedBy } : {}),
        at: node.lastHeartbeatAt ?? node.claimedAt ?? node.updatedAt,
      });
    }
  }
  for (const node of readyNodes(nodes, edges)) {
    if (node.assignee.kind !== 'human' || node.claimedBy) continue;
    items.push({
      id: `node:${node.id}:turn`,
      kind: 'pending',
      source: 'node',
      nodeId: node.id,
      text: node.title,
      at: node.updatedAt,
    });
  }
  return items.sort((a, b) =>
    (RANK[a.kind] - RANK[b.kind]) || a.at.localeCompare(b.at)
  );
};

const count = (nodes: readonly TrilhaNode[], status: string): number =>
  nodes.filter((n) => n.status === status).length;

export const buildHealth = (
  nodes: readonly TrilhaNode[],
  edges: readonly TrilhaEdge[],
  signals: readonly TrilhaSignal[],
  attention: readonly AttentionItem[],
  now = Date.now(),
): TrilhaHealth => {
  const open = { blocker: 0, warning: 0, question: 0, pending: 0 } as Record<
    SignalKind,
    number
  >;
  for (const s of signals) if (s.status === 'open') open[s.kind] += 1;
  const agents = new Set<string>();
  for (const n of nodes) {
    if (n.claimedBy && n.status !== 'done' && !isStaleClaim(n, now)) {
      agents.add(n.claimedBy);
    }
  }
  return {
    total: nodes.length,
    done: count(nodes, 'done'),
    doing: count(nodes, 'doing'),
    todo: count(nodes, 'todo'),
    blocked: count(nodes, 'blocked'),
    readyForAi:
      readyNodes(nodes, edges).filter((n) =>
        n.assignee.kind === 'ai' && !n.claimedBy
      ).length,
    waitingHuman:
      attention.filter((a) => a.kind === 'question' || a.kind === 'pending')
        .length,
    stale: attention.filter((a) => a.kind === 'stale').length,
    activeAgents: [...agents].sort(),
    open,
  };
};
