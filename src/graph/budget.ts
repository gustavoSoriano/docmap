// ════ Orçamento de nós do grafo — função pura ════
// O teto do grafo vale para o que o D3 desenha: entidades + hubs de tag.
// Cada entidade extra pode criar um hub novo, então não dá para cortar por
// contagem de entidades: acha-se o maior prefixo cujo grafo cabe no orçamento.

import { buildKnowledgeGraph } from './build.ts';
import type { GraphEntity } from './types.ts';

const nodeCount = (entities: readonly GraphEntity[]): number =>
  buildKnowledgeGraph(entities).nodes.length;

export const fitEntitiesToNodeBudget = (
  entities: readonly GraphEntity[],
  budget: number,
): { readonly page: GraphEntity[]; readonly truncated: boolean } => {
  if (nodeCount(entities) <= budget) {
    return { page: [...entities], truncated: false };
  }
  // Nós nunca diminuem ao acrescentar uma entidade: busca binária no prefixo.
  let lo = 0;
  let hi = Math.min(entities.length, budget);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (nodeCount(entities.slice(0, mid)) <= budget) lo = mid;
    else hi = mid - 1;
  }
  return { page: entities.slice(0, lo), truncated: true };
};
