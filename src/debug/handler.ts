// ════ UI server handlers para Debug Audit (porta 3333) ════
// Importa o store in-memory diretamente — mesmo processo do servidor UI.

import { json } from '../server/response.ts';
import { serveDebugPage } from './page.ts';
import {
  deleteDebugSession,
  getDebugSessionEntries,
  getDebugSessions,
} from './store.ts';

export const createDebugHandler = () => {
  return (req: Request, url: URL): Response | Promise<Response> => {
    const { pathname } = url;

    if (req.method === 'GET' && pathname === '/debug') {
      return serveDebugPage();
    }

    if (req.method === 'GET' && pathname === '/debug/api/sessions') {
      return json(getDebugSessions());
    }

    const sessionMatch = pathname.match(/^\/debug\/api\/([^\/]+)$/);
    if (sessionMatch) {
      const sessionId = decodeURIComponent(sessionMatch[1]);
      if (req.method === 'GET') {
        return json(getDebugSessionEntries(sessionId));
      }
      if (req.method === 'DELETE') {
        const deleted = deleteDebugSession(sessionId);
        return json({ ok: true, deleted });
      }
    }

    return new Response('Not found', { status: 404 });
  };
};
