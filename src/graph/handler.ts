// ════ Handler do grafo de conhecimento — GET /graph ════
// Monta o grafo a partir das entidades do KV (escopo global) com teto
// padrão de 2k (?limit=, máx 5k). Com ?q= e ?kind= a busca roda no backend
// antes do teto — o que ficar de fora o usuário acha pela busca.
// Read-only. Compartilhado pelos routers :3333 (UI) e :3334 (AI).

import { listNotes } from '../notes/store.ts';
import { listTasks } from '../tasks/store.ts';
import { listMacros } from '../macros/store.ts';
import { listPodcasts } from '../podcasts/store.ts';
import { listFavorites } from '../favorites/store.ts';
import { listSkills } from '../skills/store.ts';
import { listMocks } from '../mocks/store.ts';
import { listTrilhas } from '../trilhas/store.ts';
import { listChats } from '../agentchats/store.ts';
import { buildKnowledgeGraph } from './build.ts';
import { toGraphEntities } from './entities.ts';
import {
  filterGraphEntities,
  limitGraphEntities,
  parseGraphQuery,
} from './query.ts';
import { json } from '../server/response.ts';

export const graphHandler =
  (kv: Deno.Kv) => async (_req: Request, url: URL): Promise<Response> => {
    const [notes, tasks, macros, podcasts, favorites, skills, mocks, trilhas, agentchats] =
      await Promise.all([
        listNotes(kv),
        listTasks(kv),
        listMacros(kv),
        listPodcasts(kv),
        listFavorites(kv),
        listSkills(kv),
        listMocks(kv),
        listTrilhas(kv),
        listChats(kv),
      ]);

    const entities = toGraphEntities({
      notes,
      tasks,
      macros,
      podcasts,
      favorites,
      skills,
      mocks,
      trilhas,
      agentchats,
    });
    const query = parseGraphQuery(url);
    const filtered = filterGraphEntities(entities, query);
    const total = filtered.length;
    const { page, truncated } = limitGraphEntities(filtered, query.limit);
    const graph = buildKnowledgeGraph(page);

    return json({
      ...graph,
      total,
      limit: query.limit,
      truncated,
    });
  };
