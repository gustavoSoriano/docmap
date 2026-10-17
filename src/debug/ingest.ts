// ════ Ingestão de log de debug — compartilhada entre :3333 e :3334 ════
// Falha de JSON vem como texto simples (4xx); status/seq retornam 201.

import { badRequest, json } from '../server/response.ts';
import { addDebugEntry } from './store.ts';

const isValidBody = (
  body: unknown,
): body is { sessionId: string; payload: unknown } =>
  body !== null &&
  typeof body === 'object' &&
  !Array.isArray(body) &&
  typeof (body as Record<string, unknown>).sessionId === 'string';

export const readDebugBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
};

export const handleDebugAdd = async (req: Request): Promise<Response> => {
  const body = await readDebugBody(req);
  if (!isValidBody(body)) return badRequest('sessionId_required');
  const result = addDebugEntry(body.sessionId, body.payload);
  return json(result, 201);
};
