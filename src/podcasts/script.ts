// ════ Geração do roteiro via LLM (provider configurado no docmap) ════
// Reusa os adapters de src/ai/ — streaming acumulado em texto.
//
// Dois modos:
//   - generateScript        → diálogo puro (formato legado, sem slides)
//   - generateScriptWithSlides → diálogo com <Slide> + manifesto visual

import { getProvider } from '../ai/store.ts';
import { streamChat } from '../ai/adapters/provider.ts';
import type { ChatMessage } from '../ai/types.ts';
import type { PodcastVoice } from './types.ts';

const runProvider = async (
  kv: Deno.Kv,
  prompt: string,
): Promise<string> => {
  const provider = await getProvider(kv);
  const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

  const gen = streamChat(
    provider,
    messages,
    [],
    new AbortController().signal,
  );

  let out = '';
  for await (const chunk of gen) {
    if (chunk.error) throw new Error(chunk.error);
    if (chunk.content) out += chunk.content;
  }
  const trimmed = out.trim();
  if (!trimmed) throw new Error('provider retornou resposta vazia');
  return trimmed;
};

const buildScriptPrompt = (
  content: string,
  voices: readonly PodcastVoice[],
): string => {
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

const buildScriptWithSlidesPrompt = (
  content: string,
  voices: readonly PodcastVoice[],
): string => {
  const names = voices.map((v) => v.name).join(', ');
  return `Você é roteirista e DIRETOR VISUAL de um podcast educativo. Produza DUAS coisas numa única resposta: (1) o diálogo entre ${names} marcado em slides e (2) o manifesto visual com o HTML/CSS de cada slide.

════ PARTE 1 — DIÁLOGO COM SLIDES ════

Cerque blocos de falas com <Slide title="…" transition="…">…</Slide>. Cada <Slide> agrupa 1+ turnos relacionados ao mesmo tema visual. Nenhuma fala pode ficar de fora de um <Slide>.

Formato:
<Slide title="Título do slide" transition="fade-zoom">
  <${voices[0].name}>texto da fala</${voices[0].name}>
  <${voices[1].name}>texto da fala</${voices[1].name}>
</Slide>
<Slide title="Próximo tema" transition="slide-left">
  ...
</Slide>

Personas disponíveis (alterne naturalmente, 8–16 turnos no total):
${voices.map((v) => `- <${v.name}> para ${v.name}`).join('\n')}

════ PARTE 2 — MANIFESTO VISUAL ════

Depois do diálogo, escreva um bloco <Slides> com o conteúdo visual de CADA slide citado no diálogo. Use os MESMOS índices, títulos e transições.

<Slides>
  <Slide index="1" title="…" transition="…">
    <HTML>markup puro, sem <html>/<body>/<head></HTML>
    <CSS>seu CSS aqui</CSS>
  </Slide>
  <Slide index="2" title="…" transition="…">
    ...
  </Slide>
</Slides>

════ REGRAS DO CSS (CRÍTICAS — LEIA TODAS) ════

1. CSS ART de alto nível. Nada de slides-título com bullets. Cada slide é uma composição visual completa: gradientes complexos, mask-image, clip-path, transforms 3D (perspective, rotateX/Y), mix-blend-mode, filter, backdrop-filter, animações com @keyframes.
2.ESCOPO todo seletor com .slide-N (onde N é o índice). Ex.: \`.slide-1 h1 { … }\`, \`.slide-2 .grid { … }\`. Sem isso seu CSS quebra outros slides.
3. Use system-ui, sans-serif, monospace ou serif — sem @font-face, sem @import, sem URLs externas.
4. Animações de entrada/saída controladas por atributos no <section>:
   - [data-state="entering"] → slide começando a aparecer
   - [data-state="active"]   → slide em exibição
   - [data-state="leaving"]  → slide começando a sair
   - [data-state="hidden"]   → oculto (default)
   Ex.: \`.slide-1[data-state="entering"] { animation: fade-in .6s ease-out; }\`
5. SEM JavaScript. Apenas HTML + CSS. Sem <script>, sem onclick, sem handlers.
6. Sem <iframe>, <img> com URL externa, sem fetch/XHR. Recursos visuais apenas via CSS (shapes, gradientes, SVG inline no HTML).
7. O container do slide ocupa toda a tela (100vw/100vh ou position:absolute inset:0). Preencha o espaço — não deixe vazio.
8. Cada slide deve ilustrar o conceito com uma metáfora visual forte, não resumir o texto. Seja criativo: diagramas animados, formas geométricas em movimento, tipografia gigante construída com gradientes, etc.
9. Transições sugeridas (você pode inventar outras): fade-zoom, slide-left, slide-up, flip, morph, iris, curtain, dissolve.

════ ESTILO ════

Tema: podcast educativo moderno. Tipografia com personalidade, contraste alto, animações fluidas. Pense em motion design — os elementos entram animados quando [data-state="entering"].

════ TEXTO-FONTE ════

${content.slice(0, 10000)}`;
};

export const generateScript = (
  kv: Deno.Kv,
  content: string,
  voices: readonly PodcastVoice[],
): Promise<string> => runProvider(kv, buildScriptPrompt(content, voices));

export const generateScriptWithSlides = (
  kv: Deno.Kv,
  content: string,
  voices: readonly PodcastVoice[],
): Promise<string> =>
  runProvider(kv, buildScriptWithSlidesPrompt(content, voices));
