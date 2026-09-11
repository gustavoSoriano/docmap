import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildKnowledgeGraph } from './build.ts';

Deno.test('grafo preserva tags das entidades para busca no frontend', () => {
  const graph = buildKnowledgeGraph([
    { id: '1', kind: 'note', label: 'Arquitetura', tags: ['api', 'solo'] },
    { id: '2', kind: 'task', label: 'Contrato', tags: ['api'] },
  ]);

  const note = graph.nodes.find((node) => node.id === 'note:1');
  const tagHub = graph.nodes.find((node) => node.id === 'tag:api');

  assertEquals(note?.tags, ['api', 'solo']);
  assertEquals(tagHub?.tags, ['api']);
  assertEquals(graph.nodes.some((node) => node.id === 'tag:solo'), false);
});
