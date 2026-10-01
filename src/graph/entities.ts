// ════ Entidades do grafo — função pura ════
// Normaliza as listas dos stores para GraphEntity (só id/label/tags).

import type { GraphEntity } from './types.ts';

type Titled = {
  readonly id: string;
  readonly title: string;
  readonly tags: readonly string[];
};

type TaskLike = Titled & { readonly noteId?: string };

type MockLike = {
  readonly id: string;
  readonly method: string;
  readonly path: string;
  readonly tags: readonly string[];
};

export type GraphInput = {
  readonly notes: readonly Titled[];
  readonly tasks: readonly TaskLike[];
  readonly macros: readonly Titled[];
  readonly podcasts: readonly Titled[];
  readonly favorites: readonly Titled[];
  readonly skills: readonly Titled[];
  readonly mocks: readonly MockLike[];
  readonly trilhas: readonly Titled[];
  readonly agentchats: readonly Titled[];
};

export const toGraphEntities = (input: GraphInput): GraphEntity[] => [
  ...input.notes.map((n) => ({
    id: n.id,
    kind: 'note' as const,
    label: n.title,
    tags: n.tags,
  })),
  ...input.tasks.map((t) => ({
    id: t.id,
    kind: 'task' as const,
    label: t.title,
    tags: t.tags,
    ...(t.noteId ? { noteId: t.noteId } : {}),
  })),
  ...input.macros.map((m) => ({
    id: m.id,
    kind: 'macro' as const,
    label: m.title,
    tags: m.tags,
  })),
  ...input.podcasts.map((p) => ({
    id: p.id,
    kind: 'podcast' as const,
    label: p.title,
    tags: p.tags,
  })),
  ...input.favorites.map((f) => ({
    id: f.id,
    kind: 'favorite' as const,
    label: f.title,
    tags: f.tags,
  })),
  ...input.skills.map((s) => ({
    id: s.id,
    kind: 'skill' as const,
    label: s.title,
    tags: s.tags,
  })),
  ...input.mocks.map((m) => ({
    id: m.id,
    kind: 'mock' as const,
    label: `${m.method} ${m.path}`,
    tags: m.tags,
  })),
  ...input.trilhas.map((t) => ({
    id: t.id,
    kind: 'trilha' as const,
    label: t.title,
    tags: t.tags,
  })),
  ...input.agentchats.map((c) => ({
    id: c.id,
    kind: 'agentchat' as const,
    label: c.title,
    tags: c.tags,
  })),
];
