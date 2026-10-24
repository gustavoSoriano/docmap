// ════ Auto-layout — função pura ════
// Cada "frente" vira uma coluna: o `group` do bloco ou, sem grupo, o
// componente conectado do grafo. Dentro da coluna, ordem topológica de cima
// para baixo. Frentes que passam da largura quebram em novas faixas.

import type { TrilhaEdge, TrilhaNode } from './types.ts';

export const LAYOUT = {
  nodeW: 232,
  nodeH: 140,
  gapX: 56,
  gapY: 28,
  originX: 80,
  originY: 110,
  maxCols: 5,
} as const;

type Pos = { x: number; y: number };

const components = (
  nodes: readonly TrilhaNode[],
  edges: readonly TrilhaEdge[],
): Map<string, string> => {
  const parent = new Map(nodes.map((n) => [n.id, n.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root) as string;
    parent.set(id, root);
    return root;
  };
  for (const e of edges) {
    if (parent.has(e.fromNodeId) && parent.has(e.toNodeId)) {
      parent.set(find(e.fromNodeId), find(e.toNodeId));
    }
  }
  return new Map(nodes.map((n) => [n.id, find(n.id)]));
};

// Kahn estável: desempata pela ordem de criação.
const topoOrder = (
  members: readonly TrilhaNode[],
  edges: readonly TrilhaEdge[],
): TrilhaNode[] => {
  const ids = new Set(members.map((n) => n.id));
  const indeg = new Map(members.map((n) => [n.id, 0]));
  for (const e of edges) {
    if (ids.has(e.fromNodeId) && ids.has(e.toNodeId)) {
      indeg.set(e.toNodeId, (indeg.get(e.toNodeId) ?? 0) + 1);
    }
  }
  const out: TrilhaNode[] = [];
  const pending = [...members];
  while (pending.length) {
    const i = pending.findIndex((n) => (indeg.get(n.id) ?? 0) === 0);
    const [node] = pending.splice(i === -1 ? 0 : i, 1);
    out.push(node);
    for (const e of edges) {
      if (e.fromNodeId === node.id && indeg.has(e.toNodeId)) {
        indeg.set(e.toNodeId, (indeg.get(e.toNodeId) ?? 1) - 1);
      }
    }
  }
  return out;
};

// `heights` (opcional): altura real de cada cartão, medida pela UI. Sem ela,
// usa a altura padrão — suficiente para blocos sem macros e contexto.
export const autoLayout = (
  nodes: readonly TrilhaNode[],
  edges: readonly TrilhaEdge[],
  heights: ReadonlyMap<string, number> = new Map(),
): Map<string, Pos> => {
  const sorted = [...nodes].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
  const comp = components(sorted, edges);
  const fronts = new Map<string, TrilhaNode[]>();
  for (const n of sorted) {
    const k = n.group ? `g:${n.group}` : `c:${comp.get(n.id)}`;
    fronts.set(k, [...(fronts.get(k) ?? []), n]);
  }
  const { nodeW, nodeH, gapX, gapY, originX, originY, maxCols } = LAYOUT;
  const out = new Map<string, Pos>();
  let band = 0;
  let bandY = originY;
  let bandH = 0;
  for (const members of fronts.values()) {
    if (band === maxCols) {
      band = 0;
      bandY += bandH + gapY * 2;
      bandH = 0;
    }
    const x = originX + band * (nodeW + gapX);
    let y = bandY;
    for (const n of topoOrder(members, edges)) {
      out.set(n.id, { x, y });
      y += (heights.get(n.id) ?? nodeH) + gapY;
    }
    bandH = Math.max(bandH, y - bandY);
    band += 1;
  }
  return out;
};
