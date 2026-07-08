// ════ Tipos compartilhados do agente de IA ════
// O mesmo formato de mensagem é usado para todos os providers (OpenAI-style).

export type Provider = 'ollama' | 'deepseek';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  readonly id: string;
  readonly type: 'function';
  readonly function: {
    readonly name: string;
    readonly arguments: string;
  };
}

export interface ChatMessage {
  readonly role: ChatRole;
  readonly content: string;
  readonly tool_calls?: readonly ToolCall[];
  // obrigatório em role:'tool' para deepseek/openai (casa com tool_call.id)
  readonly tool_call_id?: string;
}

export interface ToolDefinition {
  readonly type: 'function';
  readonly function: {
    readonly name: string;
    readonly description: string;
    readonly parameters: Record<string, unknown>;
  };
}

// Chunk normalizado que cada adapter produz — unifica ollama e deepseek.
export interface ChatChunk {
  readonly content?: string;
  readonly toolCalls?: readonly ToolCall[];
  readonly error?: string;
  readonly done?: boolean;
}

export interface ProviderConfig {
  readonly provider: Provider;
}

export const DEFAULT_PROVIDER: Provider = 'ollama';

export const isProvider = (v: unknown): v is Provider =>
  v === 'ollama' || v === 'deepseek';
