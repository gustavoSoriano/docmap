// ════ Terminal — tipos ════

/** Mensagem do cliente (browser → servidor) */
export type TerminalClientMessage = TerminalInput | TerminalResize;

export interface TerminalInput {
  readonly type: 'input';
  readonly data: string;
}

export interface TerminalResize {
  readonly type: 'resize';
  readonly cols: number;
  readonly rows: number;
}

/** Handle do processo shell gerenciado pelo servidor */
export interface ShellProcess {
  readonly process: Deno.ChildProcess;
  readonly stdinWriter: WritableStreamDefaultWriter<Uint8Array>;
  /**
   * Escreve dados no stdin de forma serializada.
   * Garante ordem e evita perda sob backpressure.
   */
  write(data: Uint8Array): void;
  /** Fecha o shell. Idempotente — chamadas repetidas são no-ops. */
  close(): void;
}
