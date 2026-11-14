// CRUD e ciclo de vida do monitor (KV). Leases e runs ficam em runs.ts.

import type {
  CreateMonitorInput,
  Monitor,
  MonitorStatus,
  UpdateMonitorInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';
import {
  defaultLimits,
  normalizeInterval,
  normalizeLimits,
  rollUsage,
} from './policy.ts';
import { dayKey, nowIso, plusMinutes } from './time.ts';

const GLOBAL = '_global_';

export const monitorKey = (id: string) => ['monitors', GLOBAL, id] as const;
export const MONITOR_PREFIX = ['monitors', GLOBAL] as const;

export const runKey = (monitorId: string, runId: string) =>
  ['monitor_runs', monitorId, runId] as const;
export const runPrefix = (monitorId: string) =>
  ['monitor_runs', monitorId] as const;
export const runIndexKey = (runId: string) =>
  ['monitor_runs_by_id', runId] as const;

const MAX_TITLE = 200;
const MAX_OBJECTIVE = 8000;
const MAX_LINE = 2000;

export const cleanLines = (
  input: unknown,
  maxItems: number,
  maxLen = MAX_LINE,
): readonly string[] => {
  if (!Array.isArray(input)) return [];
  return input
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((v) => v.slice(0, maxLen));
};

const cleanText = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const emptyUsage = (nowMs: number) => ({
  day: dayKey(nowMs),
  runsToday: 0,
  tokensToday: 0,
  costToday: 0,
  runsTotal: 0,
  tokensTotal: 0,
  costTotal: 0,
});

export const listMonitors = async (kv: Deno.Kv): Promise<Monitor[]> => {
  const out: Monitor[] = [];
  for await (const entry of kv.list<Monitor>({ prefix: MONITOR_PREFIX })) {
    if (entry.value) out.push(entry.value);
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getMonitor = async (
  kv: Deno.Kv,
  id: string,
): Promise<Monitor | null> => {
  const entry = await kv.get<Monitor>(monitorKey(id));
  return entry.value;
};

export const createMonitor = async (
  kv: Deno.Kv,
  input: CreateMonitorInput,
): Promise<Monitor> => {
  const now = Date.now();
  const stamp = new Date(now).toISOString();
  const interval = normalizeInterval(input.intervalMinutes);
  const limits = normalizeLimits(input.limits, defaultLimits(now));

  const monitor: Monitor = {
    id: crypto.randomUUID(),
    title: cleanText(input.title, MAX_TITLE) || 'Monitor sem título',
    objective: cleanText(input.objective, MAX_OBJECTIVE),
    status: 'active',
    intervalMinutes: interval,
    nextRunAt: input.startNow ? stamp : plusMinutes(stamp, interval),
    lastRunAt: null,
    guardrails: cleanLines(input.guardrails, 50),
    doneCriteria: cleanLines(input.doneCriteria, 30, 500),
    requireDoneApproval: input.requireDoneApproval === true,
    tags: normalizeTags(input.tags),
    limits,
    state: {
      cursor: '',
      memory: '',
      consecutiveNoChange: 0,
      consecutiveFailures: 0,
    },
    usage: emptyUsage(now),
    lastRunSeq: 0,
    createdAt: stamp,
    updatedAt: stamp,
  };
  await kv.set(monitorKey(monitor.id), monitor);
  return monitor;
};

export const updateMonitor = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateMonitorInput,
): Promise<Monitor | null> => {
  const existing = await getMonitor(kv, id);
  if (!existing) return null;
  const now = Date.now();
  const interval = input.intervalMinutes !== undefined
    ? normalizeInterval(input.intervalMinutes)
    : existing.intervalMinutes;

  const updated: Monitor = {
    ...existing,
    ...(input.title !== undefined
      ? { title: cleanText(input.title, MAX_TITLE) || existing.title }
      : {}),
    ...(input.objective !== undefined
      ? { objective: cleanText(input.objective, MAX_OBJECTIVE) }
      : {}),
    ...(input.guardrails !== undefined
      ? { guardrails: cleanLines(input.guardrails, 50) }
      : {}),
    ...(input.doneCriteria !== undefined
      ? { doneCriteria: cleanLines(input.doneCriteria, 30, 500) }
      : {}),
    ...(input.requireDoneApproval !== undefined
      ? { requireDoneApproval: input.requireDoneApproval }
      : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    intervalMinutes: interval,
    limits: normalizeLimits(input.limits, existing.limits),
    nextRunAt:
      existing.status === 'active' && interval !== existing.intervalMinutes
        ? plusMinutes(new Date(now).toISOString(), interval)
        : existing.nextRunAt,
    updatedAt: new Date(now).toISOString(),
  };
  await kv.set(monitorKey(id), updated);
  return updated;
};

export const setMonitorStatus = async (
  kv: Deno.Kv,
  id: string,
  status: MonitorStatus,
  reason?: string,
): Promise<Monitor | null> => {
  const existing = await getMonitor(kv, id);
  if (!existing) return null;
  const now = Date.now();
  const stamp = new Date(now).toISOString();
  const base = { ...existing, status, updatedAt: stamp } as Record<
    string,
    unknown
  >;
  if (reason) base.haltReason = reason;
  else delete base.haltReason;
  if (status === 'active') {
    base.nextRunAt = stamp;
    base.state = {
      ...existing.state,
      consecutiveNoChange: 0,
      consecutiveFailures: 0,
    };
  } else {
    base.nextRunAt = null;
  }
  const updated = base as unknown as Monitor;
  await kv.set(monitorKey(id), updated);
  return updated;
};

export const resumeMonitor = (
  kv: Deno.Kv,
  id: string,
): Promise<Monitor | null> => setMonitorStatus(kv, id, 'active');

export const pauseMonitor = (
  kv: Deno.Kv,
  id: string,
  reason = 'Pausado por você.',
): Promise<Monitor | null> => setMonitorStatus(kv, id, 'paused', reason);

export const kickMonitor = async (
  kv: Deno.Kv,
  id: string,
): Promise<Monitor | null> => {
  const existing = await getMonitor(kv, id);
  if (!existing || existing.status !== 'active') return existing;
  const updated: Monitor = {
    ...rollUsage(existing, Date.now()),
    nextRunAt: nowIso(),
    updatedAt: nowIso(),
  };
  await kv.set(monitorKey(id), updated);
  return updated;
};

export const decideMonitorDone = async (
  kv: Deno.Kv,
  id: string,
  decision: 'accept' | 'reject',
): Promise<Monitor | null> => {
  const existing = await getMonitor(kv, id);
  if (!existing || existing.status !== 'review') return null;
  const now = Date.now();
  const stamp = new Date(now).toISOString();
  const base = { ...existing, updatedAt: stamp } as Record<string, unknown>;
  delete base.haltReason;

  if (decision === 'accept') {
    base.status = 'done';
    base.nextRunAt = null;
  } else {
    base.status = 'active';
    base.nextRunAt = plusMinutes(stamp, existing.intervalMinutes);
    base.state = {
      ...existing.state,
      consecutiveNoChange: 0,
      consecutiveFailures: 0,
    };
  }

  const updated = base as unknown as Monitor;
  await kv.set(monitorKey(id), updated);
  return updated;
};

export const deleteMonitor = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const existing = await getMonitor(kv, id);
  if (!existing) return false;

  for await (const entry of kv.list({ prefix: runPrefix(id) })) {
    await kv.delete(entry.key);
  }
  for await (const entry of kv.list({ prefix: ['monitor_runs_by_id'] })) {
    const value = entry.value as { monitorId?: string } | null;
    if (value?.monitorId === id) await kv.delete(entry.key);
  }
  await kv.delete(monitorKey(id));
  return true;
};
