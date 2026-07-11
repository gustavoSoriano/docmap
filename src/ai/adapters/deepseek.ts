// ════ Adapter DeepSeek (OpenAI-compatible) ════
// Streaming SSE (data: {...}). tool_calls vêm fragmentados por index — acumula.

import { DEEPSEEK_MODEL, DEEPSEEK_URL } from '../../config.ts';
import type {
  ChatChunk,
  ChatMessage,
  ToolCall,
  ToolDefinition,
} from '../types.ts';

interface AccTool {
  id?: string;
  name?: string;
  args: string;
}

export async function* callDeepSeek(
  messages: readonly ChatMessage[],
  tools: readonly ToolDefinition[],
  apiKey: string,
  signal: AbortSignal,
): AsyncGenerator<ChatChunk> {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      tools,
      max_tokens: 16_384,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = res.ok ? '' : await res.text();
    throw new Error(`DeepSeek ${res.status}: ${detail}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const toolAccum = new Map<number, AccTool>();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const chunk = JSON.parse(data);
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.content) yield { content: delta.content as string };
        if (Array.isArray(delta.tool_calls)) {
          for (const t of delta.tool_calls) {
            const idx = typeof t.index === 'number' ? t.index : 0;
            const cur = toolAccum.get(idx) ?? { args: '' };
            if (t.id) cur.id = t.id;
            if (t.function?.name) cur.name = t.function.name;
            if (typeof t.function?.arguments === 'string') {
              cur.args += t.function.arguments;
            }
            toolAccum.set(idx, cur);
          }
        }
      } catch {
        // linha SSE incompleta — aguarda próximo chunk
      }
    }
  }

  if (toolAccum.size) {
    const toolCalls: ToolCall[] = [...toolAccum.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, t]) => ({
        id: t.id ?? `call_${crypto.randomUUID()}`,
        type: 'function' as const,
        function: { name: t.name ?? '', arguments: t.args || '{}' },
      }));
    yield { toolCalls };
  }
  yield { done: true };
}
