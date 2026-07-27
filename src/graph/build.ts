// ════ Construção do grafo de conhecimento — função pura ════
// Nós = entidades + tags-agrupador. Arestas = entidade→tag-hub ('tagged') e
// task→nota via noteId ('reference').
//
// TAG_HUB_MIN: uma tag vira nó-hub quando conecta pelo menos N registros. O
// valor 2 NÃO é calibragem — é o mínimo lógico pra existir relação (tag usada
// 1× só não liga a nada, viraria um ponto solto). Toda tag que conecta 2+
// registros aparece; funciona igual em qualquer base, grande ou pequena.

import type {
  GraphEntity,
  GraphLink,
  GraphNode,
  KnowledgeGraph,
} from './types.ts';

export const TAG_HUB_MIN = 2;

const entityId = (e: GraphEntity): string => `${e.kind}:${e.id}`;

export const buildKnowledgeGraph = (
  entities: readonly GraphEntity[],
): KnowledgeGraph => {
  const nodes: GraphNode[] = entities.map((e) => ({
    id: entityId(e),
    label: e.label.trim() || '(sem título)',
    kind: e.kind,
  }));
  const links: GraphLink[] = [];
  const ids = new Set(nodes.map((n) => n.id));

  // Agrupa entidades por tag.
  const byTag = new Map<string, string[]>();
  for (const e of entities) {
    const eid = entityId(e);
    for (const tag of e.tags ?? []) {
      const arr = byTag.get(tag);
      if (arr) arr.push(eid);
      else byTag.set(tag, [eid]);
    }
  }

  // Tags-agrupador viram nós-hub; cada entidade da tag liga ao hub.
  for (const [tag, group] of byTag) {
    if (group.length < TAG_HUB_MIN) continue;
    const tid = `tag:${tag}`;
    nodes.push({ id: tid, label: `#${tag}`, kind: 'tag' });
    for (const eid of group) {
      links.push({ source: eid, target: tid, kind: 'tagged' });
    }
  }

  // Aresta task → nota (referência direta). Só liga se a nota-alvo existe.
  for (const e of entities) {
    if (e.kind === 'task' && e.noteId) {
      const target = `note:${e.noteId}`;
      if (ids.has(target)) {
        links.push({ source: entityId(e), target, kind: 'reference' });
      }
    }
  }

  return { nodes, links };
};
