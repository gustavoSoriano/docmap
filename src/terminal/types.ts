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
   * Caminho do PTY (ex: /dev/ttys004). Descoberto uma vez na inicialização
   * via pgrep -P + ps -o tty=. Usado para resize via `stty -f` sem escrever
   * no stdin. null se a detecção ainda não ocorreu ou falhou.
   */
  ptyPath: string | null;
  /**
   * Escreve dados no stdin de forma serializada.
   * Garante ordem e evita perda sob backpressure.
   */
  write(data: Uint8Array): void;
  /** Fecha o shell. Idempotente — chamadas repetidas são no-ops. */
  close(): void;
}
