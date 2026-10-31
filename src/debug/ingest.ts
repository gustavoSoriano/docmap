// ════ Ingestão de log de debug — compartilhada entre :3333 e :3334 ════
// Falha de JSON vem como texto simples (4xx); status/seq retornam 201.

import { badRequest, json } from '../server/response.ts';
import { addDebugEntry } from './store.ts';
import type { DebugEntryLink } from './types.ts';

const isValidBody = (
  body: unknown,
): body is { sessionId: string; payload: unknown; link?: unknown } =>
  body !== null &&
  typeof body === 'object' &&
  !Array.isArray(body) &&
  typeof (body as Record<string, unknown>).sessionId === 'string';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const readNode = (
  value: unknown,
): { id: string; label: string } | undefined => {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id) {
    return undefined;
  }
  return {
    id: value.id,
    label: typeof value.label === 'string' && value.label ? value.label : value.id,
  };
};

const readLink = (value: unknown): DebugEntryLink | undefined => {
  if (!isRecord(value) || typeof value.traceId !== 'string' || !value.traceId) {
    return undefined;
  }
  const from = readNode(value.from);
  const to = readNode(value.to);
  return from && to ? { traceId: value.traceId, from, to } : undefined;
};

export const readDebugBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
};

export const handleDebugAdd = async (req: Request): Promise<Response> => {
  const body = await readDebugBody(req);
  if (body === undefined) return badRequest('invalid_json');
  if (!isValidBody(body)) return badRequest('sessionId_required');
  const result = addDebugEntry(body.sessionId, body.payload, readLink(body.link));
  return json(result, 201);
};
