// ════ Handler do grafo de conhecimento — GET /graph ════
// Monta o grafo a partir de TODAS as entidades do KV (escopo global).
// Read-only. Compartilhado pelos routers :3333 (UI) e :3334 (AI).

import { listNotes } from '../notes/store.ts';
import { listTasks } from '../tasks/store.ts';
import { listMacros } from '../macros/store.ts';
import { listPodcasts } from '../podcasts/store.ts';
import { listFavorites } from '../favorites/store.ts';
import { listSkills } from '../skills/store.ts';
import { listMocks } from '../mocks/store.ts';
import { listWorkflows } from '../workflows/store.ts';
import { listChats } from '../agentchats/store.ts';
import type { Workflow } from '../workflows/types.ts';
import { buildKnowledgeGraph } from './build.ts';
import { json } from '../server/response.ts';
import type { GraphEntity } from './types.ts';

export const graphHandler =
  (kv: Deno.Kv) => async (_req: Request, _url: URL): Promise<Response> => {
    const [
      notes,
      tasks,
      macros,
      podcasts,
      favorites,
      skills,
      mocks,
      workflows,
      agentchats,
    ] = await Promise.all([
      listNotes(kv),
      listTasks(kv),
      listMacros(kv),
      listPodcasts(kv),
      listFavorites(kv),
      listSkills(kv),
      listMocks(kv),
      listWorkflows(kv) as Promise<Workflow[]>,
      listChats(kv),
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
      ...workflows.map((w) => ({
        id: w.id,
        kind: 'workflow' as const,
        label: w.title,
        tags: w.tags,
      })),
      ...agentchats.map((c) => ({
        id: c.id,
        kind: 'agentchat' as const,
        label: c.title,
        tags: c.tags,
      })),
    ];

    return json(buildKnowledgeGraph(entities));
  };
