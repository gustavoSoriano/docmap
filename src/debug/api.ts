// ════ AI API handlers para debug audit (porta 3334) ════

import { badRequest, json } from '../server/response.ts';
import { handleDebugAdd } from './ingest.ts';
import { getDebugSessionEntries } from './store.ts';

export const createDebugApiHandler = () => {
  return async (req: Request, url: URL): Promise<Response> => {
    const { pathname } = url;

    if (req.method === 'POST' && pathname === '/debug') {
      return await handleDebugAdd(req);
    }

    if (req.method === 'GET' && pathname.startsWith('/debug/')) {
      const sessionId = pathname.slice('/debug/'.length);
      if (!sessionId) return badRequest('sessionId_required');
      return json(getDebugSessionEntries(sessionId));
    }

    return new Response('Not found', { status: 404 });
  };
};
