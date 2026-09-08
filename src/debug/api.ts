// ════ AI API handlers para debug audit (porta 3334) ════

import { badRequest, json } from '../server/response.ts';
import { addDebugEntry, getDebugSessionEntries } from './store.ts';

const isValidBody = (
  body: unknown,
): body is { sessionId: string; payload: unknown } =>
  body !== null &&
  typeof body === 'object' &&
  !Array.isArray(body) &&
  typeof (body as Record<string, unknown>).sessionId === 'string';

export const createDebugApiHandler = () => {
  return async (req: Request, url: URL): Promise<Response> => {
    const { pathname } = url;

    if (req.method === 'POST' && pathname === '/debug') {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('invalid_json');
      }
      if (!isValidBody(body)) {
        return badRequest('sessionId_required');
      }
      const result = addDebugEntry(body.sessionId, body.payload);
      return json(result, 201);
    }

    if (req.method === 'GET' && pathname.startsWith('/debug/')) {
      const sessionId = pathname.slice('/debug/'.length);
      if (!sessionId) return badRequest('sessionId_required');
      const entries = getDebugSessionEntries(sessionId);
      return json(entries);
    }

    return new Response('Not found', { status: 404 });
  };
};
