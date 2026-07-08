import { createApiNotesHandler } from './handlers/notes.ts';
import { createApiSearchHandler } from './handlers/search.ts';
import { createApiGraphHandler } from './handlers/graph.ts';
import { createApiContentHandler } from './handlers/content.ts';
import { createApiSearchDocsHandler } from './handlers/search-docs.ts';
import { diagramsHandler } from '../diagrams/handler.ts';
import { skillsApiHandler } from '../skills/handler.ts';
import { tasksHandler } from '../tasks/handler.ts';
import { notFound } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '127.0.0.1',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const withCors = (res: Response): Response => {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
};

export const createApiRouter = (deps: HandlerDeps) => {
  const notes = createApiNotesHandler(deps);
  const search = createApiSearchHandler(deps);
  const graph = createApiGraphHandler(deps);
  const content = createApiContentHandler(deps);
  const searchDocs = createApiSearchDocsHandler(deps);
  const diagrams = diagramsHandler(deps.kv);
  const skills = skillsApiHandler(deps.kv);
  const tasks = tasksHandler(deps.kv);

  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    const { pathname } = url;

    let res: Response;
    if (pathname.startsWith('/notes')) res = await notes(req, url);
    else if (pathname.startsWith('/diagrams')) res = await diagrams(req, url);
    else if (pathname.startsWith('/skills')) res = await skills(req, url);
    else if (pathname.startsWith('/tasks')) res = await tasks(req, url);
    else if (pathname === '/search') res = await search(req, url);
    else if (pathname === '/graph') res = await graph(req, url);
    else if (pathname === '/content') res = await content(req, url);
    else if (pathname === '/docs/search') res = await searchDocs(req, url);
    else res = notFound();

    return withCors(res);
  };
};
