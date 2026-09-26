import type { TrilhaNodeStatus } from './types.ts';

export type TrilhaEventType =
  | 'trilha.created'
  | 'trilha.updated'
  | 'node.created'
  | 'node.updated'
  | 'node.status'
  | 'node.result'
  | 'node.claim'
  | 'node.release'
  | 'node.takeover'
  | 'edge.created'
  | 'edge.removed'
  | 'sticky.created'
  | 'sticky.updated'
  | 'sticky.removed';

export type TrilhaEvent = {
  readonly id: string;
  readonly trilhaId: string;
  readonly nodeId?: string;
  readonly nodeTitle?: string;
  readonly by?: string;
  readonly type: TrilhaEventType;
  readonly detail?: string;
  readonly createdAt: string;
};

const GLOBAL = '_global_';
const PREFIX = ['trilha_events', GLOBAL] as const;
const MAX_PER_TRILHA = 500;

export const statusLabel = (s: TrilhaNodeStatus): string =>
  ({ todo: 'a fazer', doing: 'fazendo', done: 'pronto', blocked: 'bloqueado' } as Record<
    string,
    string
  >)[s] ?? s;

export const logEvent = async (
  kv: Deno.Kv,
  trilhaId: string,
  type: TrilhaEventType,
  opts?: { nodeId?: string; nodeTitle?: string; by?: string; detail?: string },
): Promise<void> => {
  const now = new Date().toISOString();
  const event: TrilhaEvent = {
    id: crypto.randomUUID(),
    trilhaId,
    ...(opts?.nodeId ? { nodeId: opts.nodeId } : {}),
    ...(opts?.nodeTitle ? { nodeTitle: opts.nodeTitle } : {}),
    ...(opts?.by ? { by: opts.by } : {}),
    type,
    ...(opts?.detail ? { detail: opts.detail } : {}),
    createdAt: now,
  };
  await kv.set([...PREFIX, trilhaId, now, event.id], event);
  // Poda os mais antigos além do teto (chaves ordenam doVelho→novo pelo ISO).
  const keys: Deno.KvKey[] = [];
  for await (
    const entry of kv.list<TrilhaEvent>({ prefix: [...PREFIX, trilhaId] })
  ) {
    keys.push(entry.key);
  }
  for (let i = 0; i < keys.length - MAX_PER_TRILHA; i++) {
    await kv.delete(keys[i]);
  }
};

export const listEvents = async (
  kv: Deno.Kv,
  trilhaId: string,
  limit = 100,
): Promise<TrilhaEvent[]> => {
  const events: TrilhaEvent[] = [];
  for await (
    const entry of kv.list<TrilhaEvent>({ prefix: [...PREFIX, trilhaId] })
  ) {
    if (entry.value) events.push(entry.value);
  }
  return events
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(1, Math.min(limit, MAX_PER_TRILHA)));
};

export const deleteEventsOfTrilha = async (
  kv: Deno.Kv,
  trilhaId: string,
): Promise<void> => {
  for await (
    const entry of kv.list<TrilhaEvent>({ prefix: [...PREFIX, trilhaId] })
  ) {
    await kv.delete(entry.key);
  }
};
