import { listMocks } from './store.ts';
import { executeScript } from './executor.ts';
import type { MockContext } from './types.ts';

export const MOCK_PORT = 3335;

// Faz o match de um padrão com parâmetros (/users/:id) contra um path real.
// Retorna os params extraídos ou null se não casar.
const matchPath = (
  pattern: string,
  actual: string,
): Record<string, string> | null => {
  const pp = pattern.split('/').filter(Boolean);
  const ap = actual.split('/').filter(Boolean);
  if (pp.length !== ap.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = ap[i];
    } else if (pp[i] !== ap[i]) {
      return null;
    }
  }
  return params;
};

const corsHeaders = {
  'access-control-allow-origin':  '*',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization',
};

export const startMockServer = (kv: Deno.Kv): Deno.HttpServer => {
  const handler = async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url      = new URL(req.url);
    const method   = req.method;
    const pathname = url.pathname;

    let body: unknown = null;
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      try { body = await req.json(); } catch { body = null; }
    } else if (ct.includes('text/')) {
      body = await req.text();
    }

    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => { query[k] = v; });

    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });

    const mocks = await listMocks(kv);
    for (const mock of mocks) {
      if (mock.method !== method) continue;
      const params = matchPath(mock.path, pathname);
      if (params === null) continue;

      const ctx: MockContext = { method, path: pathname, params, query, headers, body };
      const result = await executeScript(mock.script, ctx, mock.collectionId);

      const resHeaders = new Headers({ ...corsHeaders, ...result.headers });
      if (!resHeaders.has('content-type')) {
        resHeaders.set('content-type', 'application/json; charset=utf-8');
      }

      const resBody = result.body === undefined
        ? ''
        : typeof result.body === 'string'
          ? result.body
          : JSON.stringify(result.body);

      return new Response(resBody, { status: result.status ?? 200, headers: resHeaders });
    }

    return new Response(
      JSON.stringify({ error: 'no_mock', message: `No mock for ${method} ${pathname}` }),
      { status: 404, headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' } },
    );
  };

  const server = Deno.serve({ port: MOCK_PORT, hostname: '127.0.0.1' }, handler);
  console.log(`  🎭 Mocks  → http://127.0.0.1:${MOCK_PORT}`);
  return server;
};
