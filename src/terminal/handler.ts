// ════ Terminal — handler HTTP (WebSocket upgrade + lifecycle) ════

import { resizeShell, spawnShell, writeStdin } from './shell.ts';
import type { ShellProcess, TerminalClientMessage } from './types.ts';
import type { HandlerDeps } from '../server/types.ts';

// ── Constantes ──

/** Tamanho máximo de payload WebSocket (64 KB — ALT-3: previne OOM) */
const MAX_WS_MESSAGE = 65_536;

/** Mínimo de colunas aceitas no resize */
const MIN_COLS = 2;
/** Mínimo de linhas aceitas no resize */
const MIN_ROWS = 1;

// ── Origin validation ──

/** Sub-redes LAN privadas (IPv4) — RFC 1918 */
const LAN_PATTERNS: readonly RegExp[] = [
  /^192\.168\./, // 192.168.0.0/16
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
];

const isAllowedOrigin = (origin: string | null): boolean => {
  // Webview mesma origem (same-origin) ou origens opacas como file://
  // podem enviar o header Origin como ausente ou como string literal "null"
  if (!origin || origin === 'null') return true;

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  // Loopback
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  ) {
    return true;
  }

  // mDNS / Bonjour (.local)
  if (hostname.endsWith('.local')) return true;

  // LAN (RFC 1918)
  for (const pattern of LAN_PATTERNS) {
    if (pattern.test(hostname)) return true;
  }

  return false;
};

// ── Helpers de validação ──

/** ALT-1: valida que cols/rows são inteiros positivos finitos */
const isValidResize = (
  cols: unknown,
  rows: unknown,
): cols is number => {
  return typeof cols === 'number' &&
    typeof rows === 'number' &&
    Number.isFinite(cols) &&
    Number.isFinite(rows) &&
    cols >= MIN_COLS &&
    rows >= MIN_ROWS;
};

// ── WebSocket handler interno ──

const handleWebSocket = (req: Request): Response => {
  const origin = req.headers.get('Origin');
  if (!isAllowedOrigin(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  let response: Response;
  let socket: WebSocket;
  try {
    const upgrade = Deno.upgradeWebSocket(req);
    socket = upgrade.socket;
    response = upgrade.response;
  } catch {
    return new Response('WebSocket upgrade failed', { status: 400 });
  }

  let shell: ShellProcess | null = null;

  socket.addEventListener('open', () => {
    try {
      shell = spawnShell(
        // onOutput: envia texto puro para o cliente (sem JSON wrapping)
        (data: string) => {
          try {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(data);
            }
          } catch {
            // socket fechado entre readyState check e send
          }
        },
        // onExit: shell morreu → fecha WebSocket (CRIT-2: code pode ser null)
        (code: number | null) => {
          try {
            if (socket.readyState === WebSocket.OPEN) {
              const msg = code === null
                ? '\r\n\x1b[33m[process killed]\x1b[0m\r\n'
                : `\r\n\x1b[33m[process exited with code ${code}]\x1b[0m\r\n`;
              socket.send(msg);
              socket.close(
                1000,
                code === null ? 'Shell killed' : `Shell exited: ${code}`,
              );
            }
          } catch {
            // socket já fechou
          }
        },
      );
    } catch (err) {
      console.error('[terminal] shell spawn failed:', err);
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            '\r\n\x1b[31m[terminal: erro ao iniciar shell — verifique se "script" está instalado]\x1b[0m\r\n',
          );
          socket.close(1011, 'Shell spawn failed');
        }
      } catch {
        // socket já fechou
      }
    }
  });

  socket.addEventListener('message', (event) => {
    if (!shell) return;

    let msg: TerminalClientMessage;
    try {
      let raw: string;
      if (typeof event.data === 'string') {
        raw = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        // ALT-3: rejeita payloads muito grandes antes do parse
        if (event.data.byteLength > MAX_WS_MESSAGE) {
          console.warn('[terminal] oversized message:', event.data.byteLength);
          return;
        }
        raw = new TextDecoder().decode(event.data);
      } else {
        // Blob ou outro tipo — não suportado
        return;
      }

      // ALT-3: valida tamanho antes do parse
      if (raw.length > MAX_WS_MESSAGE) {
        console.warn('[terminal] oversized message:', raw.length);
        return;
      }

      msg = JSON.parse(raw) as TerminalClientMessage;
    } catch {
      // B-2: loga JSON inválido para facilitar debugging
      console.warn('[terminal] invalid client message');
      return;
    }

    if (msg.type === 'input' && typeof msg.data === 'string') {
      writeStdin(shell, msg.data);
    } else if (msg.type === 'resize') {
      if (!isValidResize(msg.cols, msg.rows)) {
        console.warn('[terminal] invalid resize:', msg.cols, msg.rows);
      } else {
        resizeShell(shell, msg.cols, msg.rows);
      }
    } else {
      console.warn('[terminal] unknown/invalid message:', msg);
    }
  });

  socket.addEventListener('close', () => {
    if (shell) {
      shell.close();
      shell = null;
    }
  });

  socket.addEventListener('error', () => {
    if (shell) {
      shell.close();
      shell = null;
    }
  });

  return response;
};

// ── Handler factory (padrão do projeto) ──

export const createTerminalHandler =
  (_deps: HandlerDeps) =>
  (req: Request, url: URL): Response | Promise<Response> => {
    const { pathname } = url;

    if (pathname === '/terminal/ws') {
      return handleWebSocket(req);
    }

    return new Response('Not found', { status: 404 });
  };
