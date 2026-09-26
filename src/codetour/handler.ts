// Handler do codetour v4 — só orquestra (scan local + validação).
import {
  attachPack,
  attachTour,
  clearSession,
  getSession,
  openSession,
  publicSession,
} from './session.ts';
import { buildAgentPrompt, buildCodetourPrompt } from './prompt.ts';
import { isDepth, parseCodeTour, validateOpenInput } from './validate.ts';
import { scanProject } from './scan.ts';
import { openFolderDialog } from '../window/dialog.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import type { TourDepth } from './types.ts';

const readBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
};

export const codetourHandler =
  () => async (req: Request, url: URL): Promise<Response> => {
    const { pathname } = url;

    if (req.method === 'GET' && pathname === '/codetour/session') {
      return json({ session: publicSession(getSession()) });
    }

    if (req.method === 'POST' && pathname === '/codetour/session') {
      const body = await readBody(req);
      const err = validateOpenInput(body);
      if (err) return badRequest(err);
      const { projectRoot, query } = body as {
        projectRoot: string;
        query: string;
      };
      const rawDepth = (body as Record<string, unknown>).depth;
      const depth: TourDepth = isDepth(rawDepth) ? rawDepth : 'repasse';
      openSession(projectRoot, query, depth);
      const pack = await scanProject(projectRoot.trim(), query.trim());
      const s = attachPack(pack) ?? getSession();
      if (!s) return badRequest('falha ao abrir sessão');
      return json({
        session: publicSession(s),
        agentPrompt: buildAgentPrompt(s.projectRoot, s.query, s.depth),
      }, 201);
    }

    if (req.method === 'GET' && pathname === '/codetour/prompt') {
      const s = getSession();
      if (!s) return badRequest('selecione a pasta primeiro');
      return json({
        prompt: buildCodetourPrompt(
          s.projectRoot,
          s.query,
          s.depth,
          s.pack,
        ),
      });
    }

    if (req.method === 'GET' && pathname === '/codetour/agent-prompt') {
      const s = getSession();
      if (!s) return badRequest('selecione a pasta primeiro');
      return json({
        prompt: buildAgentPrompt(s.projectRoot, s.query, s.depth),
      });
    }

    if (req.method === 'GET' && pathname === '/codetour/structure') {
      const s = getSession();
      if (!s?.pack) return badRequest('selecione a pasta primeiro');
      return json({ pack: s.pack });
    }

    if (req.method === 'GET' && pathname === '/codetour/pick-folder') {
      const path = await openFolderDialog();
      if (!path) return json({ cancelled: true });
      return json({ path });
    }

    if (req.method === 'POST' && pathname === '/codetour/import') {
      const s = getSession();
      if (!s) return badRequest('selecione a pasta primeiro');
      const body = await readBody(req);
      const payload = body !== null && typeof body === 'object' &&
          'tour' in (body as Record<string, unknown>)
        ? (body as Record<string, unknown>).tour
        : body;
      const paths = new Set((s.pack?.files ?? []).map((f) => f.path));
      const parsed = parseCodeTour(payload, { depth: s.depth, paths });
      if ('error' in parsed) return badRequest(parsed.error);
      return json({ session: publicSession(attachTour(parsed.tour)) });
    }

    if (req.method === 'POST' && pathname === '/codetour/clear') {
      clearSession();
      return json({ ok: true });
    }

    return notFound();
  };
