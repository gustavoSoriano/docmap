import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildKnowledgeGraph } from './build.ts';
import { fitEntitiesToNodeBudget } from './budget.ts';
import type { GraphEntity } from './types.ts';

// 2 entidades por tag: cada par cria 1 hub → 3 nós por 2 entidades.
const pairs = (n: number): GraphEntity[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i),
    kind: 'note' as const,
    label: `n${i}`,
    tags: [`t${Math.floor(i / 2)}`],
  }));

Deno.test('orçamento: grafo que cabe passa inteiro', () => {
  const { page, truncated } = fitEntitiesToNodeBudget(pairs(10), 50);
  assertEquals(page.length, 10);
  assertEquals(truncated, false);
});

Deno.test('orçamento: conta hubs de tag, não só entidades', () => {
  const entities = pairs(100); // 100 entidades + 50 hubs = 150 nós
  const { page, truncated } = fitEntitiesToNodeBudget(entities, 60);
  const nodes = buildKnowledgeGraph(page).nodes.length;
  assertEquals(truncated, true);
  assertEquals(nodes <= 60, true);
  // maximal: mais uma entidade estouraria o orçamento
  const more = buildKnowledgeGraph(entities.slice(0, page.length + 1));
  assertEquals(more.nodes.length > 60, true);
});

Deno.test('orçamento: sem tags, 1 nó por entidade', () => {
  const entities: GraphEntity[] = Array.from({ length: 30 }, (_, i) => ({
    id: String(i),
    kind: 'task' as const,
    label: `t${i}`,
    tags: [],
  }));
  assertEquals(fitEntitiesToNodeBudget(entities, 20).page.length, 20);
});
