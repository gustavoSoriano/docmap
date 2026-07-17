// ════ Geração do roteiro via LLM (provider configurado no docmap) ════
// Reusa os adapters de src/ai/ — streaming acumulado em texto.

import { getProvider } from '../ai/store.ts';
import { streamChat } from '../ai/adapters/provider.ts';
import type { ChatMessage } from '../ai/types.ts';
import type { PodcastVoice } from './types.ts';

const buildPrompt = (content: string, voices: readonly PodcastVoice[]): string => {
  const tags = voices.map((v) => `<${v.name}>…</${v.name}>`).join(' e ');
  const names = voices.map((v) => v.name).join(', ');
  return `Você é um roteirista de podcast educativo. Crie um diálogo natural e envolvente entre ${names} discutindo o texto a seguir. É um material de estudo: seja didático, traga exemplos e conecte ideias.

REGRAS:
- Use <${voices[0].name}> e </${voices[0].name}> para as falas de ${voices[0].name}
${voices.slice(1).map((v) => `- Use <${v.name}> e </${v.name}> para as falas de ${v.name}`).join('\n')}
- Alterne os turnos de forma natural
- ${voices[0].name} inicia com uma saudação ao podcast
- Inclua perguntas, reações, opiniões e resumos
- Gere entre 8 e 16 turnos de fala
- Seja claro e interessante para quem está estudando o tema
- Responda APENAS com o diálogo usando as tags ${tags}, SEM explicações extras

TEXTO:
${content.slice(0, 12000)}`;
};

export const generateScript = async (
  kv: Deno.Kv,
  content: string,
  voices: readonly PodcastVoice[],
): Promise<string> => {
  const provider = await getProvider(kv);
  const messages: ChatMessage[] = [{
    role: 'user',
    content: buildPrompt(content, voices),
  }];

  const gen = streamChat(
    provider,
    messages,
    [],
    new AbortController().signal,
  );

  let script = '';
  for await (const chunk of gen) {
    if (chunk.error) throw new Error(chunk.error);
    if (chunk.content) script += chunk.content;
  }
  const trimmed = script.trim();
  if (!trimmed) throw new Error('provider retornou roteiro vazio');
  return trimmed;
};
