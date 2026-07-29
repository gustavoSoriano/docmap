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

  // ── Loop de leitura do stdout ──
  const outDecoder = new TextDecoder();
  (async () => {
    try {
      const reader = process.stdout.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          try {
            const remainder = outDecoder.decode();
            if (remainder) onOutput(remainder);
          } catch {
            // ignorar
          }
          break;
        }
        try {
          onOutput(outDecoder.decode(value, { stream: true }));
        } catch {
          // ignorar
        }
      }
    } catch (err) {
      console.error('[terminal] stdout read error:', err);
    }
  })();

  // ── Loop de leitura do stderr ──
  const errDecoder = new TextDecoder();
  (async () => {
    try {
      const reader = process.stderr.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
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

  const shellObj: ShellProcess = {
    process,
    stdinWriter,
    ptyPath: null,
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

  // ── Detecta o caminho do PTY via inspeção de processos ──
  // Usa pgrep -P e ps -o tty= para achar o terminal do shell filho.
  // Zero writes no stdin — nada aparece no terminal.
  // Após detectar (ou falhar), faz o resize inicial com o que tiver.
  const initCols = opts?.cols ?? 80;
  const initRows = opts?.rows ?? 24;
  (async () => {
    try {
      await new Promise((r) => setTimeout(r, 100));
      const pgrep = new Deno.Command('pgrep', {
        args: ['-P', String(process.pid)],
      });
      const pgrepOut = await pgrep.output();
      const childPid = new TextDecoder().decode(pgrepOut.stdout).trim();
      if (childPid) {
        const ps = new Deno.Command('ps', {
          args: ['-o', 'tty=', '-p', childPid],
        });
        const psOut = await ps.output();
        const ttyName = new TextDecoder().decode(psOut.stdout).trim();
        if (ttyName && !ttyName.includes('??') && !ttyName.includes('error')) {
          shellObj.ptyPath = `/dev/${ttyName}`;
        }
      }
    } catch {
      console.warn('[terminal] falha ao detectar PTY — resize via stdin');
    }
    // Tenta resize inicial após detecção (sempre roda — fallback via stdin se ptyPath for null)
    void resizeShell(shellObj, initCols, initRows);
  })();

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
 * Tenta primeiro via `stty -f <pty>` (subprocesso — zero echo).
 * Se o PTY path não foi descoberto, usa fallback via stdin (eco breve,
 * sem limpar a tela).
 */
export const resizeShell = async (
  shell: ShellProcess,
  cols: number,
  rows: number,
): Promise<void> => {
  try {
    const ptyPath = shell.ptyPath;
    if (ptyPath) {
      await new Deno.Command('stty', {
        args: ['-f', ptyPath, 'rows', String(rows), 'cols', String(cols)],
      }).output();
      return;
    }
  } catch {
    // stty -f falhou — tenta fallback via stdin
  }

  // Fallback: escreve no stdin (eco breve, sem \033[2J\033[H\033[3J)
  try {
    const cmd = `stty -echo rows ${rows} cols ${cols} 2>/dev/null; stty echo 2>/dev/null\n`;
    shell.write(new TextEncoder().encode(cmd));
  } catch {
    // stdin fechado — sem ação
  }
};
