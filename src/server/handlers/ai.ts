// ════ Handler de AI — proxy que esconde a chave do webview ════
// Endpoints:
//   GET  /ai/config  — provider atual + disponibilidade de cada um
//   POST /ai/config  — salva provider escolhido (persiste no KV)
//   POST /ai/chat    — stream NDJSON: cada linha é um ChatChunk normalizado

import { DEEPSEEK_API_KEY } from '../../config.ts';
import { getProvider, saveProvider } from '../../ai/store.ts';
import { isProvider, type ChatMessage, type Provider, type ToolDefinition } from '../../ai/types.ts';
import { streamChat } from '../../ai/adapters/provider.ts';
import { badRequest, json } from '../response.ts';
import type { HandlerDeps } from '../types.ts';

interface ChatRequestBody {
  readonly messages?: ChatMessage[];
  readonly tools?: ToolDefinition[];
  readonly provider?: Provider;
}

const streamNdjson = (
  producer: (ac: AbortController) => Promise<AsyncGenerator<unknown>> | AsyncGenerator<unknown>,
  req: Request,
): Response => {
  const ac = new AbortController();
  // se o client fechar a conexão, aborta o fetch ao provider
  req.signal?.addEventListener('abort', () => ac.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const gen = await producer(ac);
        for await (const chunk of gen) {
          controller.enqueue(enc.encode(JSON.stringify(chunk) + '\n'));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'erro no provider';
        controller.enqueue(enc.encode(JSON.stringify({ error: msg }) + '\n'));
      } finally {
        controller.close();
      }
    },
    cancel() {
      ac.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
};

export const createAiHandler = ({ kv }: HandlerDeps) =>
  async (req: Request, url: URL): Promise<Response> => {
    // GET /ai/config — estado atual do seletor
    if (req.method === 'GET' && url.pathname === '/ai/config') {
      const provider = await getProvider(kv);
      return json({
        provider,
        available: ['ollama', 'deepseek'] as const,
        deepseekKey: Boolean(DEEPSEEK_API_KEY),
      });
    }

    // POST /ai/config — troca de provider (persiste)
    if (req.method === 'POST' && url.pathname === '/ai/config') {
      let body: { provider?: unknown };
      try {
        body = await req.json();
      } catch {
        return badRequest('JSON inválido');
      }
      if (!isProvider(body.provider)) return badRequest('provider inválido');
      await saveProvider(kv)(body.provider);
      return json({ ok: true, provider: body.provider });
    }

    // POST /ai/chat — proxy de streaming (Ollama ou DeepSeek)
    if (req.method === 'POST' && url.pathname === '/ai/chat') {
      let body: ChatRequestBody;
      try {
        body = await req.json();
      } catch {
        return badRequest('JSON inválido');
      }
      if (!Array.isArray(body.messages)) return badRequest('messages faltando');

      const provider = isProvider(body.provider)
        ? body.provider
        : await getProvider(kv);
      const tools = Array.isArray(body.tools) ? body.tools : [];

      return streamNdjson((ac) => {
        return streamChat(provider, body.messages!, tools, ac.signal);
      }, req);
    }

    return badRequest('rota de ai desconhecida');
  };
