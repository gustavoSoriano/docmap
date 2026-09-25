import type { TrilhaEdge } from './types.ts';
import { createsCycle } from './dag.ts';

const GLOBAL = '_global_';
const PREFIX = ['trilha_edges', GLOBAL] as const;
const key = (id: string) => ['trilha_edges', GLOBAL, id] as const;

export type EdgeError = 'not_found' | 'self' | 'duplicate' | 'cycle';

export const listEdges = async (
  kv: Deno.Kv,
  trilhaId: string,
): Promise<TrilhaEdge[]> => {
  const edges: TrilhaEdge[] = [];
  for await (const entry of kv.list<TrilhaEdge>({ prefix: PREFIX })) {
    if (entry.value?.trilhaId === trilhaId) edges.push(entry.value);
  }
  return edges.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const createEdge = async (
  kv: Deno.Kv,
  trilhaId: string,
  fromNodeId: string,
  toNodeId: string,
  nodeTrilhaOf: (id: string) => Promise<string | null>,
): Promise<{ edge?: TrilhaEdge; error?: EdgeError }> => {
  if (fromNodeId === toNodeId) return { error: 'self' };
  const [fromTrilha, toTrilha] = await Promise.all([
    nodeTrilhaOf(fromNodeId),
    nodeTrilhaOf(toNodeId),
  ]);
  if (fromTrilha !== trilhaId || toTrilha !== trilhaId) {
    return { error: 'not_found' };
  }
  const existing = await listEdges(kv, trilhaId);
  if (
    existing.some((e) =>
      e.fromNodeId === fromNodeId && e.toNodeId === toNodeId
    )
  ) return { error: 'duplicate' };
  if (createsCycle(existing, fromNodeId, toNodeId)) return { error: 'cycle' };
  const edge: TrilhaEdge = {
    id: crypto.randomUUID(),
    trilhaId,
    fromNodeId,
    toNodeId,
    createdAt: new Date().toISOString(),
  };
  await kv.set(key(edge.id), edge);
  return { edge };
};

export const deleteEdge = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaEdge | null> => {
  const entry = await kv.get<TrilhaEdge>(key(id));
  if (!entry.value) return null;
  await kv.delete(key(id));
  return entry.value;
};

export const deleteEdgesOfTrilha = async (
  kv: Deno.Kv,
  trilhaId: string,
): Promise<void> => {
  for await (const entry of kv.list<TrilhaEdge>({ prefix: PREFIX })) {
    if (entry.value?.trilhaId === trilhaId) await kv.delete(entry.key);
  }
};

export const deleteEdgesOfNode = async (
  kv: Deno.Kv,
  trilhaId: string,
  nodeId: string,
): Promise<void> => {
  for await (const entry of kv.list<TrilhaEdge>({ prefix: PREFIX })) {
    const e = entry.value;
    if (
      e?.trilhaId === trilhaId &&
      (e.fromNodeId === nodeId || e.toNodeId === nodeId)
    ) await kv.delete(entry.key);
  }
};
