// ════ Tipos do grafo de conhecimento ════
// Nós = entidades do docmap + tags-AGRUPADOR (tags usadas por >= TAG_HUB_MIN
// entidades viram um nó-hub; as raras ficam de fora pra não poluir).
// Arestas: entidade→tag-hub ('tagged') e task→nota via noteId ('reference').
//
// Modelar a tag popular como NÓ (estrela) em vez de ligar as entidades
// par-a-par evita a explosão de arestas (N itens da mesma tag dariam N²
// ligações) — o projeto vira um cluster legível em torno do hub.

export type EntityKind =
  | 'note'
  | 'task'
  | 'drawing'
  | 'macro'
  | 'podcast'
  | 'favorite'
  | 'skill'
  | 'mock'
  | 'workflow'
  | 'agentchat';

export type NodeKind = EntityKind | 'tag';

export type GraphNode = {
  readonly id: string; // "<tipo>:<uuid>" (entidade) | "tag:<slug>" (hub)
  readonly label: string;
  readonly kind: NodeKind;
  readonly tags?: readonly string[];
};

export type LinkKind = 'tagged' | 'reference';

export type GraphLink = {
  readonly source: string;
  readonly target: string;
  readonly kind: LinkKind;
};

export type KnowledgeGraph = {
  readonly nodes: readonly GraphNode[];
  readonly links: readonly GraphLink[];
};

// Entidade normalizada que alimenta o build (montada a partir dos stores).
export type GraphEntity = {
  readonly id: string; // uuid da entidade
  readonly kind: EntityKind;
  readonly label: string;
  readonly tags: readonly string[];
  readonly noteId?: string; // apenas tasks vinculadas a uma nota
};
