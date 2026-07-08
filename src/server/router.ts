import { createGraphHandler } from './handlers/graph.ts';
import { createContentHandler } from './handlers/content.ts';
import { createSearchHandler } from './handlers/search.ts';
import { createCommentsHandler } from './handlers/comments.ts';
import { createNotesHandler } from './handlers/notes.ts';
import { createWorkspaceHandler } from './handlers/workspace.ts';
import { createSystemHandler } from './handlers/system.ts';
import { createAiHandler } from './handlers/ai.ts';
import { diagramsHandler } from '../diagrams/handler.ts';
import { skillsUiHandler } from '../skills/handler.ts';
import { macrosHandler } from '../macros/handler.ts';
import { tasksHandler } from '../tasks/handler.ts';
import { serveIndex } from './handlers/ui.ts';
import { notFound } from './response.ts';
import type { HandlerDeps } from './types.ts';

export const createRouter = (deps: HandlerDeps) => {
  const graph     = createGraphHandler(deps);
  const content   = createContentHandler(deps);
  const search    = createSearchHandler(deps);
  const comments  = createCommentsHandler(deps);
  const notes     = createNotesHandler(deps);
  const workspace = createWorkspaceHandler(deps);
  const system    = createSystemHandler(deps);
  const ai        = createAiHandler(deps);
  const diagrams  = diagramsHandler(deps.kv);
  const skills    = skillsUiHandler(deps.kv);
  const macros    = macrosHandler(deps.kv, deps.workspace);
  const tasks     = tasksHandler(deps.kv);

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname === '/')                              return serveIndex();
    if (pathname === '/graph')                         return graph(req, url);
    if (pathname === '/content')                       return content(req, url);
    if (pathname === '/search')                        return search(req, url);
    if (pathname === '/comments')                      return comments(req, url);
    if (pathname.startsWith('/notes'))                 return notes(req, url);
    if (pathname.startsWith('/workspace'))             return workspace(req, url);
    if (pathname.startsWith('/system'))                return system(req, url);
    if (pathname.startsWith('/ai'))                    return ai(req, url);
    if (pathname.startsWith('/diagrams'))              return diagrams(req, url);
    if (pathname.startsWith('/skills'))                return skills(req, url);
    if (pathname.startsWith('/macros'))               return macros(req, url);
    if (pathname.startsWith('/tasks'))                return tasks(req, url);

    return notFound();
  };
};
