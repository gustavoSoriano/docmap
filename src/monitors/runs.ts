// Leases, execuções e timeline. O docmap não executa nada: entrega um run
// reservado e o agente reporta o resultado (ou o lease vence).

import type {
  Monitor,
  MonitorCriterionResult,
  MonitorRun,
  ReportRunInput,
} from './types.ts';
import {
  addUsage,
  applyOutcome,
  countLease,
  evaluateMonitor,
  type Evaluation,
  rollUsage,
} from './policy.ts';
import {
  getMonitor,
  MONITOR_PREFIX,
  monitorKey,
  runIndexKey,
  runKey,
  runPrefix,
} from './store.ts';
import { plusMinutes } from './time.ts';
import { saveReport } from './reports.ts';
import { checkDoneCriteria } from './criteria.ts';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const clampInt = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;

const clampUsd = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.round(value * 100) / 100)
    : 0;

const clampText = (value: unknown, max: number): string | undefined =>
  typeof value === 'string' ? value.trim().slice(0, max) : undefined;

export type ClaimResult =
  | {
    readonly claimed: true;
    readonly monitor: Monitor;
    readonly run: MonitorRun;
  }
  | {
    readonly claimed: false;
    readonly monitor: Monitor | null;
    readonly evaluation: Evaluation | null;
  };

export const listRuns = async (
  kv: Deno.Kv,
  monitorId: string,
  limit = 100,
): Promise<MonitorRun[]> => {
  const runs: MonitorRun[] = [];
  for await (
    const entry of kv.list<MonitorRun>({ prefix: runPrefix(monitorId) })
  ) {
    if (entry.value) runs.push(entry.value);
  }
  return runs.sort((a, b) => b.seq - a.seq).slice(0, Math.min(limit, 500));
};

export const getRun = async (
  kv: Deno.Kv,
  runId: string,
): Promise<{ readonly run: MonitorRun; readonly monitor: Monitor } | null> => {
  const index = await kv.get<{ monitorId: string }>(runIndexKey(runId));
  const monitorId = index.value?.monitorId;
  if (!monitorId) return null;
  const [runEntry, monitor] = await Promise.all([
    kv.get<MonitorRun>(runKey(monitorId, runId)),
    getMonitor(kv, monitorId),
  ]);
  if (!runEntry.value || !monitor) return null;
  return { run: runEntry.value, monitor };
};

// Marca leases vencidos como `expired` e aplica a falha ao monitor.
// Idempotente: só toca runs ainda abertos.
export const reapMonitor = async (
  kv: Deno.Kv,
  monitor: Monitor,
  nowMs: number,
): Promise<Monitor> => {
  let current = rollUsage(monitor, nowMs);
  let changed = false;

  for (const entry of await listRuns(kv, monitor.id, 50)) {
    const run = entry;
    if (run.status !== 'leased' && run.status !== 'working') continue;
    if (Date.parse(run.leaseExpiresAt) > nowMs) continue;
    const expired: MonitorRun = {
      ...run,
      status: 'expired',
      finishedAt: new Date(nowMs).toISOString(),
      error: 'Lease venceu sem relatório do agente.',
    };
    await kv.set(runKey(monitor.id, run.id), expired);
    current = applyOutcome(current, 'expired', nowMs).monitor;
    changed = true;
  }

  if (changed) {
    await kv.set(monitorKey(monitor.id), current);
  }
  return current;
};

export const reapAll = async (kv: Deno.Kv, nowMs = Date.now()) => {
  const out: Monitor[] = [];
  for await (
    const entry of kv.list<Monitor>({ prefix: MONITOR_PREFIX })
  ) {
    if (!entry.value) continue;
    out.push(await reapMonitor(kv, entry.value, nowMs));
  }
  return out;
};

const applyStop = async (
  kv: Deno.Kv,
  monitor: Monitor,
  evaluation: Evaluation,
): Promise<Monitor | null> => {
  if (evaluation.due || !evaluation.applyStatus) return null;
  const stamp = new Date().toISOString();
  const updated: Monitor = {
    ...monitor,
    status: evaluation.applyStatus,
    haltReason: evaluation.reason ?? evaluation.message,
    nextRunAt: null,
    updatedAt: stamp,
  };
  await kv.set(monitorKey(monitor.id), updated);
  return updated;
};

export const claimMonitor = async (
  kv: Deno.Kv,
  monitorId: string,
  agent: string,
): Promise<ClaimResult> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const entry = await kv.get<Monitor>(monitorKey(monitorId));
    if (!entry.value) {
      return { claimed: false, monitor: null, evaluation: null };
    }

    let monitor = await reapMonitor(kv, entry.value, Date.now());
    if (monitor.status !== 'active') {
      const evaluation = evaluateMonitor(monitor, Date.now());
      const stopped = await applyStop(kv, monitor, evaluation);
      return { claimed: false, monitor: stopped ?? monitor, evaluation };
    }
    const open = (await listRuns(kv, monitor.id, 10)).find((run) =>
      (run.status === 'leased' || run.status === 'working') &&
      Date.parse(run.leaseExpiresAt) > Date.now()
    );
    if (open) {
      return {
        claimed: false,
        monitor,
        evaluation: {
          due: false,
          code: 'run_in_progress',
          message: `Execução ${open.seq} já está com outro agente.`,
          terminal: false,
        },
      };
    }
    const evaluation = evaluateMonitor(monitor, Date.now());
    if (!evaluation.due) {
      const stopped = await applyStop(kv, monitor, evaluation);
      return { claimed: false, monitor: stopped ?? monitor, evaluation };
    }

    // Releitura para o check atômico (reap/roll podem ter escrito).
    const fresh = await kv.get<Monitor>(monitorKey(monitorId));
    if (!fresh.value || fresh.value.lastRunSeq !== monitor.lastRunSeq) continue;
    monitor = rollUsage(fresh.value, Date.now());

    const now = Date.now();
    const stamp = new Date(now).toISOString();
    const seq = monitor.lastRunSeq + 1;
    const runId = crypto.randomUUID();
    const timeout = monitor.limits.runTimeoutMinutes;
    const run: MonitorRun = {
      id: runId,
      monitorId: monitor.id,
      seq,
      status: 'leased',
      agent,
      leasedAt: stamp,
      leaseExpiresAt: plusMinutes(stamp, timeout),
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      hasReport: false,
      criteria: [],
    };
    const next: Monitor = {
      ...countLease(monitor, now),
      lastRunSeq: seq,
      lastRunAt: stamp,
      nextRunAt: plusMinutes(stamp, monitor.intervalMinutes),
      updatedAt: stamp,
    };

    const commit = await kv.atomic()
      .check(fresh)
      .set(runKey(monitor.id, runId), run)
      .set(runIndexKey(runId), {
        monitorId: monitor.id,
        runId,
        seq,
      })
      .set(monitorKey(monitor.id), next)
      .commit();

    if (commit.ok) return { claimed: true, monitor: next, run };
  }

  return { claimed: false, monitor: null, evaluation: null };
};

// Primeiro monitor vencido (mais atrasado primeiro). Reap é feito em cada um.
export const claimDue = async (
  kv: Deno.Kv,
  agent: string,
): Promise<ClaimResult> => {
  const monitors = await reapAll(kv);
  const candidates: Monitor[] = [];

  for (const monitor of monitors) {
    const evaluation = evaluateMonitor(monitor, Date.now());
    if (evaluation.due) {
      candidates.push(monitor);
    } else {
      await applyStop(kv, monitor, evaluation);
    }
  }

  candidates.sort((a, b) =>
    (a.nextRunAt ?? '').localeCompare(b.nextRunAt ?? '')
  );

  for (const monitor of candidates) {
    const result = await claimMonitor(kv, monitor.id, agent);
    if (result.claimed) return result;
  }
  return {
    claimed: false,
    monitor: null,
    evaluation: monitors.length ? null : {
      due: false,
      code: 'not_due',
      message: 'Nenhum monitor.',
      terminal: false,
    },
  };
};

// Long-poll: segura a conexão até algo vencer (ou o prazo acabar).
export const waitForRun = async (
  kv: Deno.Kv,
  agent: string,
  waitSeconds: number,
): Promise<ClaimResult> => {
  const deadline = Date.now() + Math.max(0, waitSeconds) * 1000;
  let last: ClaimResult | null = null;
  for (;;) {
    const result = await claimDue(kv, agent);
    if (result.claimed) return result;
    last = result;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(2000, remaining));
  }
  return last ?? { claimed: false, monitor: null, evaluation: null };
};

export const heartbeatRun = async (
  kv: Deno.Kv,
  runId: string,
  agent?: string,
): Promise<{ readonly run: MonitorRun; readonly monitor: Monitor } | null> => {
  const found = await getRun(kv, runId);
  if (!found) return null;
  if (found.run.status !== 'leased' && found.run.status !== 'working') {
    return found;
  }
  const stamp = new Date().toISOString();
  const updated: MonitorRun = {
    ...found.run,
    status: 'working',
    startedAt: found.run.startedAt ?? stamp,
    leaseExpiresAt: plusMinutes(stamp, found.monitor.limits.runTimeoutMinutes),
    ...(agent ? { agent } : {}),
  };
  await kv.set(runKey(found.monitor.id, runId), updated);
  return { run: updated, monitor: found.monitor };
};

export type ReportErrorCode =
  | 'not_found'
  | 'already_finished'
  | 'invalid_status'
  | 'evidence_required'
  | 'criteria_incomplete';

export type ReportResult =
  | {
    readonly ok: true;
    readonly run: MonitorRun;
    readonly monitor: Monitor;
    readonly stopped?: string;
  }
  | {
    readonly ok: false;
    readonly code: ReportErrorCode;
    readonly missing?: readonly string[];
  };

export const reportRun = async (
  kv: Deno.Kv,
  runId: string,
  input: ReportRunInput,
): Promise<ReportResult> => {
  const found = await getRun(kv, runId);
  if (!found) return { ok: false, code: 'not_found' };
  if (found.run.status !== 'leased' && found.run.status !== 'working') {
    return { ok: false, code: 'already_finished' };
  }

  const status = input.status;
  if (status !== 'no-change' && status !== 'done' && status !== 'failed') {
    return { ok: false, code: 'invalid_status' };
  }

  let criteria: readonly MonitorCriterionResult[] = [];
  const evidence = clampText(input.evidence, 8000);
  if (status === 'done') {
    if (!evidence) return { ok: false, code: 'evidence_required' };
    const check = checkDoneCriteria(found.monitor.doneCriteria, input.criteria);
    if (!check.ok) {
      return {
        ok: false,
        code: 'criteria_incomplete',
        missing: check.missing,
      };
    }
    criteria = check.results;
  }

  const now = Date.now();
  const stamp = new Date(now).toISOString();
  const withUsage = addUsage(found.monitor, {
    tokensIn: clampInt(input.usage?.tokensIn),
    tokensOut: clampInt(input.usage?.tokensOut),
    costUsd: clampUsd(input.usage?.costUsd),
  }, now);

  const state = {
    ...withUsage.state,
    ...(clampText(input.state?.cursor, 2000) !== undefined
      ? { cursor: clampText(input.state?.cursor, 2000)! }
      : {}),
    ...(clampText(input.state?.memory, 20_000) !== undefined
      ? { memory: clampText(input.state?.memory, 20_000)! }
      : {}),
  };

  const applied = applyOutcome({ ...withUsage, state }, status, now);
  const report = typeof input.report === 'string' ? input.report : '';
  const hasReport = report.trim().length > 0;
  if (hasReport) await saveReport(found.monitor.id, runId, report);

  const updated: MonitorRun = {
    ...found.run,
    status,
    agent: clampText(input.agent, 80) ?? found.run.agent,
    startedAt: found.run.startedAt ?? stamp,
    finishedAt: stamp,
    ...(clampText(input.summary, 4000) !== undefined
      ? { summary: clampText(input.summary, 4000)! }
      : {}),
    ...(evidence !== undefined ? { evidence } : {}),
    tokensIn: found.run.tokensIn + clampInt(input.usage?.tokensIn),
    tokensOut: found.run.tokensOut + clampInt(input.usage?.tokensOut),
    costUsd: Math.round(
      (found.run.costUsd + clampUsd(input.usage?.costUsd)) * 100,
    ) / 100,
    hasReport,
    criteria,
  };

  await kv.set(runKey(found.monitor.id, runId), updated);
  await kv.set(monitorKey(found.monitor.id), applied.monitor);
  return {
    ok: true,
    run: updated,
    monitor: applied.monitor,
    ...(applied.stopped ? { stopped: applied.stopped } : {}),
  };
};
