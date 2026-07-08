// ════ Adapter Ollama (local) ════
// Streaming NDJSON. tool_calls chegam completos em um único chunk (não fragmentados).
//
// Diferenças do formato Ollama vs OpenAI:
// - tool_calls[].function.arguments deve ser objeto (não string JSON)
// - mensagens role:'tool' não aceitam tool_call_id

import { OLLAMA_MODEL, OLLAMA_URL } from '../../config.ts';
import type { ChatChunk, ChatMessage, ToolCall, ToolDefinition } from '../types.ts';

// Converte mensagens do formato OpenAI interno para o formato nativo do Ollama.
const toOllamaMessages = (messages: readonly ChatMessage[]): unknown[] =>
  messages.map((m) => {
    if (m.role === 'tool') {
      // Ollama não suporta tool_call_id — remove o campo
      return { role: 'tool', content: m.content };
    }
    if (m.tool_calls?.length) {
      // arguments deve ser objeto, não string JSON
      const tool_calls = m.tool_calls.map((tc) => ({
        ...tc,
        function: {
          ...tc.function,
          arguments: typeof tc.function.arguments === 'string'
            ? (() => { try { return JSON.parse(tc.function.arguments); } catch { return {}; } })()
            : tc.function.arguments,
        },
      }));
      return { ...m, tool_calls };
    }
    return m;
  });

export async function* callOllama(
  messages: readonly ChatMessage[],
  tools: readonly ToolDefinition[],
  signal: AbortSignal,
): AsyncGenerator<ChatChunk> {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: toOllamaMessages(messages),
      tools,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = res.ok ? '' : await res.text();
    throw new Error(`Ollama ${res.status}: ${detail}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const pendingToolCalls: ToolCall[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        const msg = chunk.message;
        if (!msg) continue;
        if (msg.content) yield { content: msg.content as string };
        if (Array.isArray(msg.tool_calls)) {
          // Normaliza para o formato OpenAI/DeepSeek:
          // function.arguments sempre como STRING JSON.
          for (const tc of msg.tool_calls) {
            const name = tc?.function?.name;
            if (!name) continue;
            const rawArgs = tc.function?.arguments;
            const argsStr = typeof rawArgs === 'string'
              ? rawArgs
              : JSON.stringify(rawArgs ?? {});
            pendingToolCalls.push({
              id: tc.id ?? `call_${crypto.randomUUID()}`,
              type: 'function' as const,
              function: { name, arguments: argsStr },
            });
          }
        }
      } catch {
        // linha JSON incompleta — aguarda próximo chunk
      }
    }
  }

  if (pendingToolCalls.length) yield { toolCalls: pendingToolCalls };
  yield { done: true };
}
