// Tipos do canvas — lousa realtime (Quickdraw) com sync por diffs.
// O documento é um mapa plano de records imutáveis; toda mutação emite um
// diff { added, removed, updated } que trafega pelo WebSocket.

export interface BoardRecord {
  readonly id: string;
  readonly typeName: string;
  readonly [key: string]: unknown;
}

export interface BoardDiff {
  readonly added?: Readonly<Record<string, BoardRecord>>;
  readonly removed?: Readonly<Record<string, BoardRecord>>;
  readonly updated?: Readonly<
    Record<string, readonly [BoardRecord, BoardRecord]>
  >;
}

export interface BoardSnapshot {
  readonly document: {
    readonly store: Readonly<Record<string, BoardRecord>>;
  };
}

// ── Cliente → servidor ──

export type ClientMessage = {
  readonly type: 'diff';
  readonly diff: BoardDiff;
};

// ── Servidor → cliente ──

export type ServerMessage =
  | { readonly type: 'snapshot'; readonly snapshot: BoardSnapshot }
  | { readonly type: 'diff'; readonly diff: BoardDiff }
  | { readonly type: 'peers'; readonly count: number };

export interface CanvasInfoResponse {
  readonly vendor: string;
  readonly peers: number;
  readonly shapes: number;
}
