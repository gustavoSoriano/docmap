// ════ Dispatcher de providers ════
// Escolhe o adapter certo e devolve sempre um AsyncGenerator<ChatChunk>.

import { DEEPSEEK_API_KEY } from '../../config.ts';
import { callDeepSeek } from './deepseek.ts';
import { callOllama } from './ollama.ts';
import type { ChatChunk, ChatMessage, Provider, ToolDefinition } from '../types.ts';

export const streamChat = (
  provider: Provider,
  messages: readonly ChatMessage[],
  tools: readonly ToolDefinition[],
  signal: AbortSignal,
): AsyncGenerator<ChatChunk> => {
  if (provider === 'deepseek') {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY não configurada. Exporte a env var.');
    }
    return callDeepSeek(messages, tools, DEEPSEEK_API_KEY, signal);
  }
  return callOllama(messages, tools, signal);
};
