// ════ Query do grafo — funções puras ════
// Teto padrão 2k entidades: com busca no backend, o que ficar de fora
// o usuário acha via ?q=. Evita travar o D3/SVG em bases de 500-2000+ nós.

import type { EntityKind, GraphEntity } from './types.ts';

export const GRAPH_DEFAULT_LIMIT = 2000;
export const GRAPH_MAX_LIMIT = 5000;

export type GraphQuery = {
  readonly limit: number;
  readonly q: string;
  readonly kinds: readonly EntityKind[];
};

const VALID_KINDS: readonly EntityKind[] = [
  'note',
  'task',
  'macro',
  'podcast',
  'favorite',
  'skill',
  'mock',
  'trilha',
  'agentchat',
];

const isEntityKind = (v: string): v is EntityKind =>
  (VALID_KINDS as readonly string[]).includes(v);

export const parseGraphQuery = (url: URL): GraphQuery => {
  const raw = url.searchParams.get('limit');
  const num = raw === null || raw.trim() === '' ? NaN : Number(raw);
  const limit = Number.isFinite(num)
    ? Math.min(Math.max(Math.floor(num), 1), GRAPH_MAX_LIMIT)
    : GRAPH_DEFAULT_LIMIT;
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120);
  const rawKinds = (url.searchParams.get('kind') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(isEntityKind);
  return { limit, q, kinds: rawKinds };
};

const matchesQuery = (e: GraphEntity, term: string): boolean => {
  const t = term.toLowerCase();
  if (e.label.toLowerCase().includes(t)) return true;
  return (e.tags ?? []).some((tag) => tag.toLowerCase().includes(t));
};

export const filterGraphEntities = (
  entities: readonly GraphEntity[],
  query: GraphQuery,
): GraphEntity[] => {
  const { kinds, q } = query;
  const term = q.trim().toLowerCase();
  if (kinds.length === 0 && !term) return [...entities];
  return entities.filter((e) => {
    if (kinds.length > 0 && !kinds.includes(e.kind)) return false;
    if (term && !matchesQuery(e, term)) return false;
    return true;
  });
};

export const limitGraphEntities = (
  entities: readonly GraphEntity[],
  limit: number,
): { readonly page: GraphEntity[]; readonly truncated: boolean } => {
  if (entities.length <= limit) return { page: [...entities], truncated: false };
  return { page: entities.slice(0, limit), truncated: true };
};
