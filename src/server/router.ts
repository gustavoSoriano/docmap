import { graphHandler } from '../graph/handler.ts';
import { createNotesHandler } from './handlers/notes.ts';
import { createCommentsHandler } from './handlers/comments.ts';
import { createSystemHandler } from './handlers/system.ts';
import { diagramsHandler } from '../diagrams/handler.ts';
import { skillsUiHandler } from '../skills/handler.ts';
import { macrosHandler } from '../macros/handler.ts';
import { projectsHandler } from '../projects/handler.ts';
import { tasksHandler } from '../tasks/handler.ts';
import { mocksHandler } from '../mocks/handler.ts';
import { favoritesHandler } from '../favorites/handler.ts';
import { podcastsHandler } from '../podcasts/handler.ts';
import { createCanvasHandler } from '../canvas/handler.ts';
import { createTerminalHandler } from '../terminal/handler.ts';
import { workflowsHandler } from '../workflows/handler.ts';
import { createDebugHandler } from '../debug/handler.ts';
import { headlessHandler } from '../headless/handler.ts';
import { serveIndex } from './handlers/ui.ts';
import { notFound } from './response.ts';
import type { HandlerDeps } from './types.ts';

export const createRouter = (deps: HandlerDeps) => {
  const graph = graphHandler(deps.kv);
  const notes = createNotesHandler(deps);
  const comments = createCommentsHandler(deps);
  const system = createSystemHandler(deps);
  const diagrams = diagramsHandler(deps.kv);
  const skills = skillsUiHandler(deps.kv);
  const macros = macrosHandler(deps.kv);
  const projects = projectsHandler(deps.kv);
  const tasks = tasksHandler(deps.kv);
  const mocks = mocksHandler(deps.kv);
  const favorites = favoritesHandler(deps.kv);
  const podcasts = podcastsHandler(deps.kv);
  const canvas = createCanvasHandler(deps);
  const terminal = createTerminalHandler(deps);
  const workflows = workflowsHandler(deps.kv);
  const debug = createDebugHandler();
  return (req: Request): Response | Promise<Response> => {
    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname === '/') return serveIndex();
    if (pathname === '/debug' || pathname.startsWith('/debug/')) {
      return debug(req, url);
    }
    if (pathname.startsWith('/headless')) return headlessHandler(req, url);
    if (pathname === '/graph') return graph(req, url);
    if (pathname.startsWith('/notes')) return notes(req, url);
    if (pathname === '/comments') return comments(req, url);
    if (pathname.startsWith('/system')) return system(req, url);
    if (pathname.startsWith('/diagrams')) return diagrams(req, url);
    if (pathname.startsWith('/skills')) return skills(req, url);
    if (pathname.startsWith('/macros')) return macros(req, url);
    if (pathname.startsWith('/projects')) return projects(req, url);
    if (pathname.startsWith('/tasks')) return tasks(req, url);
    if (pathname.startsWith('/mocks')) return mocks(req, url);
    if (pathname.startsWith('/favorites')) return favorites(req, url);
    if (pathname.startsWith('/podcasts')) return podcasts(req, url);
    if (pathname.startsWith('/canvas')) return canvas(req, url);
    if (pathname.startsWith('/terminal')) return terminal(req, url);
    if (
      pathname.startsWith('/workflows') ||
      pathname.startsWith('/agents') ||
      pathname.startsWith('/orchestrator')
    ) return workflows(req, url);

    return notFound();
  };
};
