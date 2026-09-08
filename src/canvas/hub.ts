// Canvas Board Hub — singleton.
// Relay de diffs do whiteboard: cada cliente desenha localmente e envia o
// diff de origem 'user'; o hub aplica num mapa plano de records (op-log) e
// repassa aos demais. Late joiners recebem o snapshot atual completo.
// Diffs 'remote' nunca entram no undo local (regra do próprio Store).

import type {
  BoardDiff,
  BoardRecord,
  BoardSnapshot,
  ServerMessage,
  SnapshotText,
} from './types.ts';
import { buildRecords, placeShapes } from './shapes.ts';
import type { ShapeInput } from './shapes.ts';

/** Tamanho máximo de um diff aceito (imagens vão embutidas no documento). */
const MAX_DIFF_BYTES = 5 * 1024 * 1024;

/** Tamanho máximo do frame PNG aceito (cliente já envia downscaled). */
const MAX_FRAME_BYTES = 8 * 1024 * 1024;

/** Magic bytes de PNG: 89 50 4E 47 0D 0A 1A 0A. */
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const isRecord = (v: unknown): v is BoardRecord => {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === 'string' && !!r.id && typeof r.typeName === 'string';
};

/** Valida um diff vindo do WS. Retorna null se válido, senão o motivo. */
export const validateDiff = (v: unknown): string | null => {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    return 'diff deve ser um objeto';
  }
  const d = v as Record<string, unknown>;
  for (const key of ['added', 'removed'] as const) {
    const section = d[key];
    if (section === undefined) continue;
    if (
      section === null || typeof section !== 'object' || Array.isArray(section)
    ) {
      return `${key} deve ser um objeto`;
    }
    for (const [id, rec] of Object.entries(section)) {
      if (!id || !isRecord(rec) || rec.id !== id) {
        return `${key}.${id} inválido`;
      }
    }
  }
  const updated = d.updated;
  if (updated !== undefined) {
    if (
      updated === null || typeof updated !== 'object' || Array.isArray(updated)
    ) {
      return 'updated deve ser um objeto';
    }
    for (const [id, pair] of Object.entries(updated)) {
      if (
        !Array.isArray(pair) || pair.length !== 2 ||
        !isRecord(pair[0]) || !isRecord(pair[1]) || pair[1].id !== id
      ) {
        return `updated.${id} inválido`;
      }
    }
  }
  if (JSON.stringify(v).length > MAX_DIFF_BYTES) return 'diff excede 5MB';
  return null;
};

export const emptySnapshot = (): BoardSnapshot => ({ document: { store: {} } });

const round1 = (n: unknown): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;

/**
 * Extrai textos legíveis dos records (função pura, best-effort).
 * text/note → props.text; geo → props.label. Traços e imagens não têm texto.
 */
export const extractTexts = (
  records:
    | ReadonlyMap<string, BoardRecord>
    | Readonly<Record<string, BoardRecord>>,
): SnapshotText[] => {
  const entries = records instanceof Map
    ? records.values()
    : Object.values(records);
  const out: SnapshotText[] = [];
  for (const rec of entries) {
    if (rec.typeName !== 'shape' || typeof rec.type !== 'string') continue;
    const props =
      rec.props && typeof rec.props === 'object' && !Array.isArray(rec.props)
        ? (rec.props as Record<string, unknown>)
        : null;
    if (!props) continue;
    if (
      (rec.type === 'text' || rec.type === 'note') &&
      typeof props.text === 'string'
    ) {
      const text = props.text.trim();
      if (text) {
        out.push({
          id: rec.id,
          kind: rec.type,
          text,
          x: round1(rec.x),
          y: round1(rec.y),
        });
      }
    } else if (rec.type === 'geo' && typeof props.label === 'string') {
      const text = props.label.trim();
      if (text) {
        out.push({
          id: rec.id,
          kind: 'label',
          text,
          x: round1(rec.x),
          y: round1(rec.y),
        });
      }
    }
  }
  return out;
};

/** Valida bytes de frame PNG. Retorna null se válido, senão o motivo. */
export const validateFrame = (bytes: Uint8Array): string | null => {
  if (bytes.length === 0) return 'frame vazio';
  if (bytes.length > MAX_FRAME_BYTES) return 'frame excede 8MB';
  if (
    bytes.length < PNG_MAGIC.length ||
    !PNG_MAGIC.every((b, i) => bytes[i] === b)
  ) {
    return 'frame não é PNG';
  }
  return null;
};

class BoardHub {
  readonly #connections = new Set<WebSocket>();
  readonly #records = new Map<string, BoardRecord>();
  #updatedAt: string | null = null;
  #frame: {
    readonly bytes: Uint8Array<ArrayBuffer>;
    readonly updatedAt: string;
  } | null = null;

  /** Número de clientes (desenhistas + espectadores) conectados. */
  get connectionCount(): number {
    return this.#connections.size;
  }

  /** Quantidade de shapes no board. */
  get shapeCount(): number {
    return this.#records.size;
  }

  /** ISO da última mutação (diff aplicado ou clear). Null se intocado. */
  get updatedAt(): string | null {
    return this.#updatedAt;
  }

  /** Último frame PNG enviado por um viewer. Null se nenhum. */
  get frame(): {
    readonly bytes: Uint8Array<ArrayBuffer>;
    readonly updatedAt: string;
  } | null {
    return this.#frame;
  }

  /** Textos extraídos dos records (text/note/label). */
  get texts(): SnapshotText[] {
    return extractTexts(this.#records);
  }

  /** Snapshot atual — enviado a late joiners. */
  getSnapshot(): BoardSnapshot {
    return { document: { store: Object.fromEntries(this.#records) } };
  }

  /** Registra conexão; envia snapshot + atualiza contagem de peers. */
  add(ws: WebSocket): void {
    this.#connections.add(ws);
    // O upgrade só completa após o handler retornar o response — o estado
    // inicial espera o 'open' se o socket ainda estiver conectando.
    // Broadcasts nesse intervalo são descartados (#send), por isso o
    // recém-chegado recebe snapshot + peers juntos aqui.
    const sync = (): void => {
      this.#send(ws, { type: 'snapshot', snapshot: this.getSnapshot() });
      this.#send(ws, { type: 'peers', count: this.#connections.size });
    };
    if (ws.readyState === WebSocket.OPEN) sync();
    else ws.addEventListener('open', sync, { once: true });
    this.#broadcastPeers();
    ws.addEventListener('close', () => this.#remove(ws));
    ws.addEventListener('error', () => this.#remove(ws));
  }

  /**
   * Aplica um diff de usuário no op-log e repassa aos demais clientes.
   * Last-writer-wins por record — suficiente p/ whiteboard (cada traço
   * tem id único; conflito real só em drag simultâneo do mesmo shape).
   */
  applyUserDiff(diff: BoardDiff, sender: WebSocket): void {
    for (const rec of Object.values(diff.added ?? {})) {
      this.#records.set(rec.id, rec);
    }
    for (const [, [, to]] of Object.entries(diff.updated ?? {})) {
      this.#records.set(to.id, to);
    }
    for (const id of Object.keys(diff.removed ?? {})) this.#records.delete(id);
    this.#updatedAt = new Date().toISOString();
    this.#broadcast({ type: 'diff', diff }, sender);
  }

  /** Guarda o frame PNG enviado por um viewer (last-write-wins). */
  setFrame(bytes: Uint8Array): string {
    const updatedAt = new Date().toISOString();
    // Cópia normalizada: o Response exige Uint8Array<ArrayBuffer>.
    this.#frame = { bytes: new Uint8Array(bytes), updatedAt };
    return updatedAt;
  }

  /**
   * Insere shapes da IA (POST /canvas/shapes): posiciona, gera ids/z,
   * aplica no op-log e difunde a TODOS (sem remetente). Retorna os ids.
   */
  insertShapes(inputs: readonly ShapeInput[]): string[] {
    const placed = placeShapes(inputs, this.#records);
    const startZ = this.#maxZ() + 1;
    const records = buildRecords(placed, startZ);
    const added: Record<string, BoardRecord> = {};
    for (const rec of records) {
      this.#records.set(rec.id, rec);
      added[rec.id] = rec;
    }
    this.#updatedAt = new Date().toISOString();
    this.#broadcast({ type: 'diff', diff: { added } });
    return records.map((rec) => rec.id);
  }

  #maxZ(): number {
    let z = 0;
    for (const rec of this.#records.values()) {
      const recZ = rec.z;
      if (typeof recZ === 'number' && Number.isFinite(recZ) && recZ > z) {
        z = recZ;
      }
    }
    return z;
  }

  /** Limpa o board (botão Limpar / POST /canvas/clear). Invalida o frame. */
  clearBoard(): void {
    this.#records.clear();
    this.#frame = null;
    this.#updatedAt = new Date().toISOString();
    this.#broadcast({ type: 'snapshot', snapshot: emptySnapshot() });
  }

  #remove(ws: WebSocket): void {
    if (!this.#connections.delete(ws)) return;
    this.#broadcastPeers();
  }

  #broadcastPeers(): void {
    this.#broadcast({ type: 'peers', count: this.#connections.size });
  }

  #broadcast(msg: ServerMessage, except?: WebSocket): void {
    const data = JSON.stringify(msg);
    for (const ws of [...this.#connections]) {
      if (ws === except) continue;
      this.#send(ws, data);
    }
  }

  #send(ws: WebSocket, msg: ServerMessage | string): void {
    const data = typeof msg === 'string' ? msg : JSON.stringify(msg);
    try {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
      // CONNECTING: socket em handshake (ex.: snapshot inicial já vai no
      // 'open') — só descarta o broadcast, sem remover a conexão.
      else if (ws.readyState !== WebSocket.CONNECTING) this.#remove(ws);
    } catch (err) {
      console.error('board hub: send error', err);
      this.#remove(ws);
    }
  }
}

export const boardHub = new BoardHub();
