// ════ UI server handlers para Debug Audit (porta 3333) ════
// Importa o store in-memory diretamente — mesmo processo do servidor UI.
// POST /debug (e /debug/api) aceita logs de agentes QUEQUER sem Origin.

import { json, notFound } from '../server/response.ts';
import { serveDebugPage } from './page.ts';
import { handleDebugAdd } from './ingest.ts';
import {
  deleteDebugSession,
  getDebugSessionEntries,
  getDebugSessions,
} from './store.ts';

export const createDebugHandler = () => {
  return async (req: Request, url: URL): Promise<Response> => {
    const pathname = url.pathname;
    const method = req.method;

    if (method === 'GET' && pathname === '/debug') {
      return serveDebugPage();
    }

    if (
      method === 'POST' &&
      (pathname === '/debug' || pathname === '/debug/api')
    ) {
      return await handleDebugAdd(req);
    }

    if (method === 'GET' && pathname === '/debug/api/sessions') {
      return json(getDebugSessions());
    }

    const sessionMatch = pathname.match(/^\/debug\/(?:api\/)?([^\/]+)$/);
    if (sessionMatch) {
      const sessionId = decodeURIComponent(sessionMatch[1]);
      if (sessionId === 'sessions' || sessionId === 'api') return notFound();
      if (method === 'GET') {
        return json(getDebugSessionEntries(sessionId));
      }
      if (method === 'DELETE') {
        const deleted = deleteDebugSession(sessionId);
        return json({ ok: true, deleted });
      }
    }

    return notFound();
  };
};
