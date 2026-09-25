import { createApiNotesHandler } from './handlers/notes.ts';
import { categoriesHandler } from '../categories/handler.ts';
import { createApiMacrosHandler } from './handlers/macros.ts';
import { createApiSearchHandler } from './handlers/search.ts';
import { createApiFavoritesHandler } from './handlers/favorites.ts';
import { createDebugApiHandler } from '../debug/api.ts';
import { graphHandler } from '../graph/handler.ts';
import { skillsApiHandler } from '../skills/handler.ts';
import { tasksHandler } from '../tasks/handler.ts';
import { projectsHandler } from '../projects/handler.ts';
import { mocksHandler } from '../mocks/handler.ts';
import { podcastsHandler } from '../podcasts/handler.ts';
import { workflowsHandler } from '../workflows/handler.ts';
import { agentChatsHandler } from '../agentchats/handler.ts';
import { headlessHandler } from '../headless/handler.ts';
import { notFound } from '../server/response.ts';
import { isLoopbackOrigin } from '../server/security.ts';
import type { HandlerDeps } from '../server/types.ts';

const corsHeaders = (origin: string | null): HeadersInit => ({
  'Access-Control-Allow-Origin': origin && origin !== 'null'
    ? origin
    : 'http://127.0.0.1',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
});

const withCors = (res: Response, origin: string | null): Response => {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(origin))) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
};

export const createApiRouter = (deps: HandlerDeps) => {
  const notes = createApiNotesHandler(deps);
  const categories = categoriesHandler(deps);
  const macros = createApiMacrosHandler(deps);
  const search = createApiSearchHandler(deps);
  const graph = graphHandler(deps.kv);
  const favorites = createApiFavoritesHandler(deps);
  const skills = skillsApiHandler(deps.kv);
  const tasks = tasksHandler(deps.kv);
  const projects = projectsHandler(deps.kv);
  const mocks = mocksHandler(deps.kv);
  const podcasts = podcastsHandler(deps.kv);
  const workflows = workflowsHandler(deps.kv);
  const agentChats = agentChatsHandler(deps.kv);
  const debug = createDebugApiHandler();

  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin');
    if (!isLoopbackOrigin(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(req.url);
    const { pathname } = url;

    let res: Response;
    if (pathname === '/debug' || pathname.startsWith('/debug/')) {
      res = await debug(req, url);
    } else if (pathname.startsWith('/headless')) {
      res = headlessHandler(req, url);
    }     else if (pathname.startsWith('/notes')) res = await notes(req, url);
    else if (pathname.startsWith('/categories')) res = await categories(req, url);
    else if (pathname.startsWith('/macros')) res = await macros(req, url);
    else if (pathname.startsWith('/skills')) res = await skills(req, url);
    else if (pathname.startsWith('/tasks')) res = await tasks(req, url);
    else if (pathname.startsWith('/projects')) res = await projects(req, url);
    else if (pathname === '/search') res = await search(req, url);
    else if (pathname === '/graph') res = await graph(req, url);
    else if (pathname.startsWith('/favorites')) res = await favorites(req, url);
    else if (pathname.startsWith('/mocks')) res = await mocks(req, url);
    else if (pathname.startsWith('/podcasts')) res = await podcasts(req, url);
    else if (pathname.startsWith('/agentchats')) res = await agentChats(req, url);
    else if (
      pathname.startsWith('/workflows') ||
      pathname.startsWith('/agents') ||
      pathname.startsWith('/orchestrator')
    ) res = await workflows(req, url);
    else res = notFound();

    return withCors(res, origin);
  };
};
