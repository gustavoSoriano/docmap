// ════ Terminal — spawn do shell com PTY (via script) ════

import type { ShellProcess } from './types.ts';

/**
 * Spawna um shell dentro de um PTY wrapper (`script -q`).
 *
 * O `script` do macOS/BSD e do Linux (util-linux) têm sintaxes
 * ligeiramente diferentes — detectamos o OS para montar os args.
 *
 * O shell roda no $HOME do usuário, não no workspace do DocMap.
 */
export const spawnShell = (
  onOutput: (data: string) => void,
  onExit: (code: number | null) => void,
  opts?: { cols?: number; rows?: number },
): ShellProcess => {
  const shellPath = Deno.env.get('SHELL') || '/bin/bash';
  const home = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '.';

  // Constrói argumentos do `script` conforme o OS
  const isMac = Deno.build.os === 'darwin';
  const scriptArgs = isMac
    ? ['-q', '/dev/null', shellPath, '-l']
    : ['-q', '-c', `${shellPath} -l`, '/dev/null'];

  const cols = opts?.cols ?? 80;
  const rows = opts?.rows ?? 24;

  // Env mínimo que o shell precisa para funcionar como terminal interativo
  const env: Record<string, string> = {
    HOME: home,
    PATH: Deno.env.get('PATH') ?? '/usr/bin:/bin',
    USER: Deno.env.get('USER') ?? '',
    SHELL: shellPath,
    LANG: Deno.env.get('LANG') ?? 'en_US.UTF-8',
    TERM: 'xterm-256color',
    COLUMNS: String(cols),
    LINES: String(rows),
  };

  // Passa LC_* e outras vars de locale que já estiverem no ambiente
  for (const key of ['LC_ALL', 'LC_CTYPE', 'TZ', 'SSH_AUTH_SOCK']) {
    const val = Deno.env.get(key);
    if (val) env[key] = val;
  }

  const cmd = new Deno.Command('script', {
    args: scriptArgs,
    cwd: home,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
    env,
  });

  const process = cmd.spawn();

  // Writer persistente do stdin — evita lock contention entre write e resize
  const stdinWriter = process.stdin.getWriter();

  // ── Fila de escrita serial (ALT-5: evita perda de dados sob backpressure) ──
  let writeChain: Promise<void> = Promise.resolve();

  // ── Controle de lifecycle (ALT-4: close idempotente) ──
  let closed = false;
  let sigkillTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Loop de leitura do stdout ──
  const outDecoder = new TextDecoder();
  (async () => {
    try {
      const reader = process.stdout.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // MED-1: flush final do decoder para não perder bytes multi-byte
          try {
            const remainder = outDecoder.decode();
            if (remainder) onOutput(remainder);
          } catch {
            // onOutput pode lançar se o WebSocket já fechou
          }
          break;
        }
        try {
          onOutput(outDecoder.decode(value, { stream: true }));
        } catch {
          // onOutput pode lançar se o WebSocket já fechou — ignora
        }
      }
    } catch (err) {
      console.error('[terminal] stdout read error:', err);
    }
  })();

  // ── Loop de leitura do stderr (decoder próprio, sem compartilhar estado) ──
  const errDecoder = new TextDecoder();
  (async () => {
    try {
      const reader = process.stderr.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // MED-1: flush final
          try {
            const remainder = errDecoder.decode();
            if (remainder) onOutput(remainder);
          } catch {
            // ignorar
          }
          break;
        }
        try {
          onOutput(errDecoder.decode(value, { stream: true }));
        } catch {
          // ignorar
        }
      }
    } catch (err) {
      console.error('[terminal] stderr read error:', err);
    }
  })();

  // ── Watcher de exit ──
  (async () => {
    try {
      const status = await process.status;
      // Cancela timer de SIGKILL pendente (B-1 do code-quality-review)
      if (sigkillTimer !== null) {
        clearTimeout(sigkillTimer);
        sigkillTimer = null;
      }
      onExit(status.code);
    } catch {
      onExit(-1);
    }
  })();

  const shellObj: ShellProcess = {
    process,
    stdinWriter,
    write: (data: Uint8Array): void => {
      writeChain = writeChain.then(() =>
        stdinWriter.write(data).catch(() => {
          // write falhou (stdin fechado) — descarta silenciosamente
        })
      );
    },
    close: () => {
      if (closed) return; // ALT-4: idempotente
      closed = true;

      // Drena writes pendentes com um write vazio antes de liberar o lock
      writeChain = writeChain.catch(() => {});

      try {
        stdinWriter.releaseLock();
      } catch {
        // já liberado
      }
      try {
        process.kill('SIGTERM');
      } catch {
        // processo já morto
      }
      // Garantia extra: SIGKILL após 1s se ainda estiver vivo
      sigkillTimer = setTimeout(() => {
        try {
          process.kill('SIGKILL');
        } catch {
          // já foi
        }
        sigkillTimer = null;
      }, 1000);
    },
  };

  // Ajusta PTY com o tamanho inicial (env COLUMNS/LINES + stty).
  // Executa uma vez na abertura — resize em tempo real não é necessário.
  resizeShell(shellObj, opts?.cols ?? 80, opts?.rows ?? 24);

  return shellObj;
};

/**
 * Escreve dados no stdin do shell.
 * Usa fila serial para evitar perda de dados sob backpressure (ALT-5).
 * Seguro chamar após o shell ter fechado (try/catch interno).
 */
export const writeStdin = (shell: ShellProcess, data: string): void => {
  try {
    const encoded = new TextEncoder().encode(data);
    shell.write(encoded);
  } catch {
    // stdin fechado — sem ação
  }
};

/**
 * Ajusta o tamanho do terminal.
 *
 * Escreve uma sequência no stdin do shell que:
 * 1. Desabilita o eco local (stty -echo) — o próprio comando ainda ecoa,
 *    mas comandos futuros não.
 * 2. Ajusta rows/cols.
 * 3. Limpa a tela com ANSI escape (\033[2J\033[H\033[3J) — isso apaga
 *    o texto do comando que foi ecoado no passo 1.
 * 4. Reabilita o eco (stty echo) — este comando NÃO ecoa porque o eco
 *    já está desligado.
 *
 * O resultado visual: o comando de resize pisca por ~1 frame e desaparece.
 * O prompt do shell aparece logo após, como se nada tivesse acontecido.
 */
export const resizeShell = (
  shell: ShellProcess,
  cols: number,
  rows: number,
): void => {
  try {
    // \033[2J = limpa tela inteira
    // \033[H  = cursor para (0,0)
    // \033[3J = limpa scrollback (xterm extension, suportado pelo xterm.js)
    const encoded = new TextEncoder().encode(
      `stty -echo rows ${rows} cols ${cols} 2>/dev/null; printf '\\033[2J\\033[H\\033[3J'; stty echo 2>/dev/null\n`,
    );
    shell.write(encoded);
  } catch {
    // stdin fechado — sem ação
  }
};
