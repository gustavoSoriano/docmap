import { graphHandler } from '../graph/handler.ts';
import { createContentHandler } from './handlers/content.ts';
import { createSearchHandler } from './handlers/search.ts';
import { createCommentsHandler } from './handlers/comments.ts';
import { createNotesHandler } from './handlers/notes.ts';
import { createWorkspaceHandler } from './handlers/workspace.ts';
import { createSystemHandler } from './handlers/system.ts';
import { createAiHandler } from './handlers/ai.ts';
import { createCodeSearchHandler } from './handlers/code-search.ts';
import { createGitHandler } from './handlers/git.ts';
import { createRunHandler } from './handlers/run.ts';
import {
  createFileTypeHandler,
  createWorkspaceFilesHandler,
} from './handlers/workspace-files.ts';
import { diagramsHandler } from '../diagrams/handler.ts';
import { skillsUiHandler } from '../skills/handler.ts';
import { macrosHandler } from '../macros/handler.ts';
import { tasksHandler } from '../tasks/handler.ts';
import { mocksHandler } from '../mocks/handler.ts';
import { favoritesHandler } from '../favorites/handler.ts';
import { podcastsHandler } from '../podcasts/handler.ts';
import { serveIndex } from './handlers/ui.ts';
import { notFound } from './response.ts';
import type { HandlerDeps } from './types.ts';

export const createRouter = (deps: HandlerDeps) => {
  const graph = graphHandler(deps.kv);
  const content = createContentHandler(deps);
  const search = createSearchHandler(deps);
  const comments = createCommentsHandler(deps);
  const notes = createNotesHandler(deps);
  const workspace = createWorkspaceHandler(deps);
  const system = createSystemHandler(deps);
  const ai = createAiHandler(deps);
  const codeSearch = createCodeSearchHandler(deps);
  const git = createGitHandler(deps);
  const run = createRunHandler(deps);
  const workspaceFiles = createWorkspaceFilesHandler(deps);
  const fileType = createFileTypeHandler(deps);
  const diagrams = diagramsHandler(deps.kv);
  const skills = skillsUiHandler(deps.kv);
  const macros = macrosHandler(deps.kv, deps.workspace);
  const tasks = tasksHandler(deps.kv);
  const mocks = mocksHandler(deps.kv);
  const favorites = favoritesHandler(deps.kv);
  const podcasts = podcastsHandler(deps.kv);
  return (req: Request): Response | Promise<Response> => {
    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname === '/') return serveIndex();
    if (pathname === '/graph') return graph(req, url);
    if (pathname === '/content') return content(req, url);
    if (pathname === '/search') return search(req, url);
    if (pathname === '/comments') return comments(req, url);
    if (pathname === '/code/search') return codeSearch(req, url);
    if (pathname === '/run') return run(req);
    if (pathname === '/workspace/files') return workspaceFiles(req, url);
    if (pathname === '/workspace/file-type') return fileType(req, url);
    if (pathname.startsWith('/git/')) return git(req, url);
    if (pathname.startsWith('/notes')) return notes(req, url);
    if (pathname.startsWith('/workspace')) return workspace(req, url);
    if (pathname.startsWith('/system')) return system(req, url);
    if (pathname.startsWith('/ai')) return ai(req, url);
    if (pathname.startsWith('/diagrams')) return diagrams(req, url);
    if (pathname.startsWith('/skills')) return skills(req, url);
    if (pathname.startsWith('/macros')) return macros(req, url);
    if (pathname.startsWith('/tasks')) return tasks(req, url);
    if (pathname.startsWith('/mocks')) return mocks(req, url);
    if (pathname.startsWith('/favorites')) return favorites(req, url);
    if (pathname.startsWith('/podcasts')) return podcasts(req, url);

    return notFound();
  };
};
