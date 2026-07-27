// ════ Handler do grafo de conhecimento — GET /graph ════
// Monta o grafo a partir de TODAS as entidades do KV (escopo global).
// Read-only. Compartilhado pelos routers :3333 (UI) e :3334 (AI).

import { listNotes } from '../notes/store.ts';
import { listTasks } from '../tasks/store.ts';
import { listDiagrams } from '../diagrams/store.ts';
import { listMacros } from '../macros/store.ts';
import { listPodcasts } from '../podcasts/store.ts';
import { listFavorites } from '../favorites/store.ts';
import { listSkills } from '../skills/store.ts';
import { listMocks } from '../mocks/store.ts';
import { buildKnowledgeGraph } from './build.ts';
import { json } from '../server/response.ts';
import type { GraphEntity } from './types.ts';

export const graphHandler =
  (kv: Deno.Kv) => async (_req: Request, _url: URL): Promise<Response> => {
    const [notes, tasks, diagrams, macros, podcasts, favorites, skills, mocks] =
      await Promise.all([
        listNotes(kv),
        listTasks(kv),
        listDiagrams(kv),
        listMacros(kv),
        listPodcasts(kv),
        listFavorites(kv),
        listSkills(kv),
        listMocks(kv),
      ]);

    const entities: GraphEntity[] = [
      ...notes.map((n) => ({
        id: n.id,
        kind: 'note' as const,
        label: n.title,
        tags: n.tags,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        kind: 'task' as const,
        label: t.title,
        tags: t.tags,
        ...(t.noteId ? { noteId: t.noteId } : {}),
      })),
      ...diagrams.map((d) => ({
        id: d.id,
        kind: 'diagram' as const,
        label: d.title,
        tags: d.tags,
      })),
      ...macros.map((m) => ({
        id: m.id,
        kind: 'macro' as const,
        label: m.title,
        tags: m.tags,
      })),
      ...podcasts.map((p) => ({
        id: p.id,
        kind: 'podcast' as const,
        label: p.title,
        tags: p.tags,
      })),
      ...favorites.map((f) => ({
        id: f.id,
        kind: 'favorite' as const,
        label: f.title,
        tags: f.tags,
      })),
      ...skills.map((s) => ({
        id: s.id,
        kind: 'skill' as const,
        label: s.title,
        tags: s.tags,
      })),
      ...mocks.map((m) => ({
        id: m.id,
        kind: 'mock' as const,
        label: `${m.method} ${m.path}`,
        tags: m.tags,
      })),
    ];

    return json(buildKnowledgeGraph(entities));
  };
