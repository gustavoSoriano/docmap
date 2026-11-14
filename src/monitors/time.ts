// Utilitários de tempo — funções puras, sem estado.

export const MINUTE_MS = 60_000;
export const DAY_MS = 86_400_000;

export const nowIso = (): string => new Date().toISOString();

export const plusMinutes = (iso: string, minutes: number): string =>
  new Date(Date.parse(iso) + minutes * MINUTE_MS).toISOString();

// Dia local (o usuário pensa em "hoje" no fuso dele, não em UTC).
export const dayKey = (ms: number): string => {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Próxima meia-noite local, em ISO — quando os limites diários reabrem.
export const nextDayStart = (ms: number): string => {
  const d = new Date(ms);
  d.setHours(24, 0, 0, 0);
  return d.toISOString();
};

export const isPast = (
  iso: string | null | undefined,
  nowMs: number,
): boolean => {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t <= nowMs;
};

export const minutesBetween = (fromIso: string, toMs: number): number => {
  const t = Date.parse(fromIso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.round((toMs - t) / MINUTE_MS));
};

export const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
