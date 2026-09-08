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
} from './types.ts';

/** Tamanho máximo de um diff aceito (imagens vão embutidas no documento). */
const MAX_DIFF_BYTES = 5 * 1024 * 1024;

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

class BoardHub {
  readonly #connections = new Set<WebSocket>();
  readonly #records = new Map<string, BoardRecord>();

  /** Número de clientes (desenhistas + espectadores) conectados. */
  get connectionCount(): number {
    return this.#connections.size;
  }

  /** Quantidade de shapes no board. */
  get shapeCount(): number {
    return this.#records.size;
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
    this.#broadcast({ type: 'diff', diff }, sender);
  }

  /** Limpa o board (botão Limpar / POST /canvas/clear). */
  clearBoard(): void {
    this.#records.clear();
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
