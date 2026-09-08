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
  readonly updatedAt: string | null;
  readonly hasFrame: boolean;
}

export interface SnapshotText {
  readonly id: string;
  readonly kind: 'text' | 'note' | 'label';
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

export interface CanvasSnapshotResponse {
  readonly snapshot: BoardSnapshot;
  readonly texts: readonly SnapshotText[];
  readonly shapes: number;
  readonly updatedAt: string | null;
}

export interface CanvasFrameResponse {
  readonly ok: boolean;
  readonly bytes: number;
  readonly updatedAt: string;
}

export interface CanvasShapesResponse {
  readonly ok: boolean;
  readonly ids: readonly string[];
  readonly count: number;
}

// ── Biblioteca: collections + desenhos (metadados no KV, snapshot no FS) ──

export interface DrawingCollection {
  readonly id: string;
  readonly name: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DrawingMeta {
  readonly id: string;
  readonly collectionId: string;
  readonly name: string;
  readonly tags: readonly string[];
  readonly shapes: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DrawingDocument {
  readonly version: 1;
  readonly snapshot: BoardSnapshot;
}

export interface DrawingOpenResponse {
  readonly drawing: DrawingMeta;
  readonly snapshot: BoardSnapshot;
}
