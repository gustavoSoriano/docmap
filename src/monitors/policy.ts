// Regras puras do monitor: orçamento, limites e critérios de parada.
// Nada aqui escreve no KV — o store aplica o resultado.

import type {
  Monitor,
  MonitorLimits,
  MonitorLimitsInput,
  MonitorStatus,
  MonitorUsage,
} from './types.ts';
import { DAY_MS, dayKey, nextDayStart } from './time.ts';

export const MIN_INTERVAL_MINUTES = 5;
export const MAX_INTERVAL_MINUTES = 7 * 24 * 60;
const DEFAULT_EXPIRY_DAYS = 7;

const clampInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const n = typeof value === 'number' && Number.isFinite(value)
    ? Math.floor(value)
    : fallback;
  return Math.min(max, Math.max(min, n));
};

const clampUsd = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
  return Math.min(1000, Math.max(0, Math.round(n * 100) / 100));
};

export const normalizeInterval = (minutes: unknown): number =>
  clampInt(minutes, 30, MIN_INTERVAL_MINUTES, MAX_INTERVAL_MINUTES);

export const defaultLimits = (nowMs: number): MonitorLimits => ({
  maxRunsPerDay: 50,
  maxTokensPerDay: 200_000,
  maxCostUsdPerDay: 5,
  maxConsecutiveFailures: 5,
  idleRunsToPause: 6,
  runTimeoutMinutes: 15,
  expiresAt: new Date(nowMs + DEFAULT_EXPIRY_DAYS * DAY_MS).toISOString(),
});

export const normalizeLimits = (
  input: MonitorLimitsInput | undefined,
  base: MonitorLimits,
): MonitorLimits => {
  const merged = { ...base, ...(input ?? {}) } as Record<string, unknown>;

  const expiresRaw = merged.expiresAt;
  let expiresAt: string | undefined;
  if (typeof expiresRaw === 'string' && expiresRaw.trim()) {
    const t = Date.parse(expiresRaw);
    if (Number.isFinite(t)) expiresAt = new Date(t).toISOString();
  }

  const maxRunsRaw = merged.maxRuns;
  const maxRuns = typeof maxRunsRaw === 'number' && Number.isFinite(maxRunsRaw)
    ? Math.max(1, Math.floor(maxRunsRaw))
    : undefined;

  return {
    ...(maxRuns !== undefined ? { maxRuns } : {}),
    maxRunsPerDay: clampInt(merged.maxRunsPerDay, 24, 1, 10_000),
    maxTokensPerDay: clampInt(
      merged.maxTokensPerDay,
      300_000,
      1_000,
      100_000_000,
    ),
    maxCostUsdPerDay: clampUsd(merged.maxCostUsdPerDay, 2),
    maxConsecutiveFailures: clampInt(
      merged.maxConsecutiveFailures,
      5,
      1,
      100,
    ),
    idleRunsToPause: clampInt(merged.idleRunsToPause, 6, 1, 100),
    runTimeoutMinutes: clampInt(merged.runTimeoutMinutes, 15, 1, 1440),
    ...(expiresAt ? { expiresAt } : {}),
  };
};

// Zera o balde diário quando o dia local muda. Puro: devolve o mesmo objeto
// se nada mudou (evita writes desnecessários).
export const rollUsage = (monitor: Monitor, nowMs: number): Monitor => {
  const today = dayKey(nowMs);
  if (monitor.usage.day === today) return monitor;
  const usage: MonitorUsage = {
    ...monitor.usage,
    day: today,
    runsToday: 0,
    tokensToday: 0,
    costToday: 0,
  };
  return { ...monitor, usage, updatedAt: new Date(nowMs).toISOString() };
};

export const addUsage = (
  monitor: Monitor,
  delta: { tokensIn?: number; tokensOut?: number; costUsd?: number },
  nowMs: number,
): Monitor => {
  const rolled = rollUsage(monitor, nowMs);
  const tokens = Math.max(0, (delta.tokensIn ?? 0) + (delta.tokensOut ?? 0));
  const cost = Math.max(0, Math.round((delta.costUsd ?? 0) * 100) / 100);
  return {
    ...rolled,
    usage: {
      ...rolled.usage,
      tokensToday: rolled.usage.tokensToday + tokens,
      costToday: Math.round((rolled.usage.costToday + cost) * 100) / 100,
      tokensTotal: rolled.usage.tokensTotal + tokens,
      costTotal: Math.round((rolled.usage.costTotal + cost) * 100) / 100,
    },
    updatedAt: new Date(nowMs).toISOString(),
  };
};

export const countLease = (monitor: Monitor, nowMs: number): Monitor => {
  const rolled = rollUsage(monitor, nowMs);
  return {
    ...rolled,
    usage: {
      ...rolled.usage,
      runsToday: rolled.usage.runsToday + 1,
      runsTotal: rolled.usage.runsTotal + 1,
    },
  };
};

export type BlockCode =
  | 'done'
  | 'paused'
  | 'halted'
  | 'review'
  | 'expired'
  | 'max_runs'
  | 'failures'
  | 'idle'
  | 'daily_runs'
  | 'daily_tokens'
  | 'daily_cost'
  | 'not_due'
  | 'run_in_progress';

export type Evaluation =
  | { readonly due: true }
  | {
    readonly due: false;
    readonly code: BlockCode;
    readonly message: string;
    /** true = o docmap deve mudar o status agora (parada dura). */
    readonly terminal: boolean;
    readonly until?: string;
    readonly applyStatus?: MonitorStatus;
    readonly reason?: string;
  };

const stop = (
  code: BlockCode,
  message: string,
  applyStatus: MonitorStatus,
): Evaluation => ({
  due: false,
  code,
  message,
  terminal: true,
  applyStatus,
  reason: message,
});

// Avalia se o monitor pode rodar agora. Pressupõe usage já rolado.
export const evaluateMonitor = (
  monitor: Monitor,
  nowMs: number,
): Evaluation => {
  if (monitor.status === 'done') {
    return {
      due: false,
      code: 'done',
      message: 'Monitor concluído.',
      terminal: false,
    };
  }
  if (monitor.status === 'paused') {
    return {
      due: false,
      code: 'paused',
      message: monitor.haltReason ?? 'Monitor pausado.',
      terminal: false,
    };
  }
  if (monitor.status === 'halted') {
    return {
      due: false,
      code: 'halted',
      message: monitor.haltReason ?? 'Monitor parado por guardrail.',
      terminal: false,
    };
  }
  if (monitor.status === 'review') {
    return {
      due: false,
      code: 'review',
      message: monitor.haltReason ?? 'Aguardando sua confirmação de conclusão.',
      terminal: false,
    };
  }

  const limits = monitor.limits;
  if (limits.expiresAt && Date.parse(limits.expiresAt) <= nowMs) {
    return stop(
      'expired',
      `Prazo do monitor venceu em ${limits.expiresAt}.`,
      'halted',
    );
  }
  if (
    limits.maxRuns !== undefined && monitor.usage.runsTotal >= limits.maxRuns
  ) {
    return stop(
      'max_runs',
      `Limite total de ${limits.maxRuns} execuções atingido.`,
      'halted',
    );
  }
  if (monitor.state.consecutiveFailures >= limits.maxConsecutiveFailures) {
    return stop(
      'failures',
      `${monitor.state.consecutiveFailures} falhas seguidas — monitor parado.`,
      'halted',
    );
  }
  if (monitor.state.consecutiveNoChange >= limits.idleRunsToPause) {
    return stop(
      'idle',
      `${monitor.state.consecutiveNoChange} execuções sem novidade — monitor pausado.`,
      'paused',
    );
  }

  const until = nextDayStart(nowMs);
  if (monitor.usage.runsToday >= limits.maxRunsPerDay) {
    return {
      due: false,
      code: 'daily_runs',
      message: `Teto diário de ${limits.maxRunsPerDay} execuções atingido.`,
      terminal: false,
      until,
    };
  }
  if (monitor.usage.tokensToday >= limits.maxTokensPerDay) {
    return {
      due: false,
      code: 'daily_tokens',
      message: `Teto diário de ${limits.maxTokensPerDay} tokens atingido.`,
      terminal: false,
      until,
    };
  }
  if (monitor.usage.costToday >= limits.maxCostUsdPerDay) {
    return {
      due: false,
      code: 'daily_cost',
      message: `Teto diário de US$ ${limits.maxCostUsdPerDay} atingido.`,
      terminal: false,
      until,
    };
  }

  if (monitor.nextRunAt && Date.parse(monitor.nextRunAt) > nowMs) {
    return {
      due: false,
      code: 'not_due',
      message: `Próxima execução em ${monitor.nextRunAt}.`,
      terminal: false,
    };
  }

  return { due: true };
};

export type RunOutcome = 'no-change' | 'done' | 'failed' | 'expired';

// Aplica o resultado terminal ao monitor. Retorna o monitor atualizado e se
// alguma parada automática foi disparada.
export const applyOutcome = (
  monitor: Monitor,
  outcome: RunOutcome,
  nowMs: number,
): { readonly monitor: Monitor; readonly stopped?: string } => {
  const state = { ...monitor.state };
  const stamp = new Date(nowMs).toISOString();
  let status: MonitorStatus = monitor.status;
  let haltReason = monitor.haltReason;

  if (outcome === 'no-change') {
    state.consecutiveNoChange += 1;
    state.consecutiveFailures = 0;
  } else if (outcome === 'failed' || outcome === 'expired') {
    state.consecutiveFailures += 1;
    state.consecutiveNoChange = 0;
  } else {
    state.consecutiveNoChange = 0;
    state.consecutiveFailures = 0;
  }

  if (outcome === 'done') {
    if (monitor.requireDoneApproval) {
      status = 'review';
      haltReason = 'Agente propôs conclusão; confirme ou rejeite.';
    } else {
      status = 'done';
      haltReason = undefined;
    }
  } else if (
    state.consecutiveFailures >= monitor.limits.maxConsecutiveFailures
  ) {
    status = 'halted';
    haltReason =
      `${state.consecutiveFailures} falhas seguidas — monitor parado automaticamente.`;
  } else if (state.consecutiveNoChange >= monitor.limits.idleRunsToPause) {
    status = 'paused';
    haltReason =
      `${state.consecutiveNoChange} execuções sem novidade — monitor pausado automaticamente.`;
  }

  const finishedAt = outcome === 'done' ? stamp : undefined;
  const updated: Monitor = {
    ...monitor,
    state,
    status,
    ...(haltReason ? { haltReason } : {}),
    ...(finishedAt && status === 'done' ? { nextRunAt: null } : {}),
    ...(status === 'review' || status === 'halted' || status === 'paused'
      ? { nextRunAt: null }
      : {}),
    updatedAt: stamp,
  };

  const stopped = status !== monitor.status && status !== 'review'
    ? haltReason
    : undefined;
  return { monitor: updated, ...(stopped ? { stopped } : {}) };
};

// Quanto ainda cabe hoje — usado no prompt e na UI.
export const remainingBudget = (
  monitor: Monitor,
): {
  readonly runs: number;
  readonly tokens: number;
  readonly costUsd: number;
} => ({
  runs: Math.max(0, monitor.limits.maxRunsPerDay - monitor.usage.runsToday),
  tokens: Math.max(
    0,
    monitor.limits.maxTokensPerDay - monitor.usage.tokensToday,
  ),
  costUsd: Math.max(
    0,
    Math.round(
      (monitor.limits.maxCostUsdPerDay - monitor.usage.costToday) * 100,
    ) /
      100,
  ),
});
