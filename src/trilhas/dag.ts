// ════ DAG puro — validação anti-ciclo das dependências ════
// Um ciclo (A→B→A) travaria começo-meio-fim. Toda aresta nova passa por
// `createsCycle` antes de persistir. Sem side effects, sem KV aqui.

export type EdgePair = {
  readonly fromNodeId: string;
  readonly toNodeId: string;
};

export const createsCycle = (
  edges: readonly EdgePair[],
  from: string,
  to: string,
): boolean => {
  if (from === to) return true;
  const outgoing = new Map<string, string[]>();
  for (const e of edges) {
    const list = outgoing.get(e.fromNodeId) ?? [];
    list.push(e.toNodeId);
    outgoing.set(e.fromNodeId, list);
  }
  const visited = new Set<string>([to]);
  const stack: string[] = [to];
  while (stack.length) {
    const current = stack.pop() as string;
    if (current === from) return true;
    for (const next of outgoing.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        stack.push(next);
      }
    }
  }
  return false;
};
