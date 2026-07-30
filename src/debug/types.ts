// ════ Tipos do buffer de debug audit ════

export type DebugEntry = {
  readonly seq: number;
  readonly ts: string;
  readonly sessionId: string;
  readonly payload: unknown;
  readonly createdAt: number;
};

export type DebugSessionSummary = {
  readonly sessionId: string;
  readonly count: number;
  readonly lastTs: string | null;
};
