// ════ Buffer de debug in-memory com TTL e ring buffer global ════
// Estado mutável isolado: este é o único arquivo do módulo debug que mantém
// estado. Nenhuma persistência, nenhum acesso ao KV.

import type { DebugEntry, DebugSessionSummary } from './types.ts';

const MAX_ENTRIES = 1000;
const TTL_MS = 20 * 60 * 1000; // 20 minutos

let nextSeq = 1;
const buffer: DebugEntry[] = [];

const formatTs = (d = new Date()): string => {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const mmm = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${mmm}`;
};

const isExpired = (entry: DebugEntry): boolean =>
  Date.now() - entry.createdAt > TTL_MS;

const cleanup = (): void => {
  const now = Date.now();
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (now - buffer[i].createdAt > TTL_MS) {
      buffer.splice(i, 1);
    }
  }
};

export const addDebugEntry = (
  sessionId: string,
  payload: unknown,
): Pick<DebugEntry, 'seq' | 'ts'> => {
  cleanup();

  while (buffer.length >= MAX_ENTRIES) {
    buffer.shift();
  }

  const seq = nextSeq++;
  const ts = formatTs();
  const entry: DebugEntry = {
    seq,
    ts,
    sessionId,
    payload,
    createdAt: Date.now(),
  };
  buffer.push(entry);
  return { seq, ts };
};

export const getDebugSessionEntries = (sessionId: string): DebugEntry[] =>
  buffer
    .filter((e) => e.sessionId === sessionId && !isExpired(e))
    .sort((a, b) => a.seq - b.seq);

export const getDebugSessions = (): DebugSessionSummary[] => {
  const map = new Map<string, DebugSessionSummary & { lastCreatedAt: number }>();
  for (const entry of buffer) {
    if (isExpired(entry)) continue;
    const current = map.get(entry.sessionId);
    if (!current || entry.createdAt > current.lastCreatedAt) {
      map.set(entry.sessionId, {
        sessionId: entry.sessionId,
        count: current ? current.count + 1 : 1,
        lastTs: entry.ts,
        lastCreatedAt: entry.createdAt,
      });
    } else {
      map.set(entry.sessionId, {
        sessionId: entry.sessionId,
        count: current.count + 1,
        lastTs: current.lastTs,
        lastCreatedAt: current.lastCreatedAt,
      });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.lastCreatedAt - a.lastCreatedAt)
    .map(({ sessionId, count, lastTs }) => ({ sessionId, count, lastTs }));
};

export const deleteDebugSession = (sessionId: string): number => {
  let removed = 0;
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (buffer[i].sessionId === sessionId) {
      buffer.splice(i, 1);
      removed++;
    }
  }
  return removed;
};

export const debugStats = (): { entries: number; sessions: number } => {
  const sessions = getDebugSessions();
  return {
    entries: sessions.reduce((sum, s) => sum + s.count, 0),
    sessions: sessions.length,
  };
};
