// ════ Tipos do buffer de debug audit ════

export type DebugEntry = {
  readonly seq: number;
  readonly ts: string;
  readonly sessionId: string;
  readonly payload: unknown;
  readonly link?: DebugEntryLink;
  readonly createdAt: number;
};

export type DebugEntryLink = {
  readonly traceId: string;
  readonly from: { readonly id: string; readonly label: string };
  readonly to: { readonly id: string; readonly label: string };
};

export type DebugSessionSummary = {
  readonly sessionId: string;
  readonly count: number;
  readonly lastTs: string | null;
};
