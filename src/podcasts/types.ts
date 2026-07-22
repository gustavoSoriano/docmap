// ════ Tipos do módulo de podcasts ════
// Metadados ficam no KV; o áudio (MP3) e os slides (HTML) ficam no filesystem
// (ver audio.ts e slides.ts) por causa do limite de ~64 KiB/valor do KV.

export type PodcastStatus = 'generating' | 'ready' | 'error';

// Uma persona do diálogo: `name` é a tag usada no roteiro (<Person1>),
// `voice` é o id da voz do Edge TTS (pt-BR-AntonioNeural).
export type PodcastVoice = {
  readonly name: string;
  readonly voice: string;
};

// Dica semântica de transição escolhida pela LLM (ex.: 'fade-zoom',
// 'slide-left', 'flip', 'iris'). O efeito visual real vem do CSS que a
// própria LLM escreve reagindo a [data-state] — este campo é só um label.
export type SlideTransition = string;

// Conteúdo visual de um slide, conforme produzido pela LLM.
// HTML é markup puro (sem <html>/<body>); CSS é escopado por .slide-N.
export type Slide = {
  readonly index: number; // 1-based, casa com SlideMapEntry.index
  readonly title: string;
  readonly transition?: SlideTransition;
  readonly html: string;
  readonly css: string;
};

// Entrada do mapa "qual slide cobre quais segmentos do diálogo".
// `enterMs` é calculado no pipeline acumulando a duração (ffprobe) dos
// MP3s por segmento — não pode ser chutado pela LLM.
export type SlideMapEntry = {
  readonly index: number; // 1-based
  readonly title: string;
  readonly transition?: SlideTransition;
  readonly segmentStart: number; // índice do 1º Segment (inclusive)
  readonly segmentEnd: number; // exclusive (segmentStart == segmentEnd = vazio)
  readonly enterMs: number; // ms dentro do áudio final em que o slide aparece
};

export type Podcast = {
  readonly id: string;
  readonly title: string;
  readonly folder: string;
  readonly tags: readonly string[]; // tema/assunto — eixo do grafo
  // Roteiro com tags <Nome>…</Nome>. Vazio até a LLM gerar (quando o
  // pedido veio com `content` em vez de roteiro pronto).
  //
  // Quando `scriptFs === true`, o roteiro real está offloaded para o
  // filesystem (script.txt dentro do diretório do podcast) porque excedeu
  // o limite de ~64 KiB do KV. Use readScript() para abstrair.
  readonly script: string;
  readonly scriptFs?: boolean;
  // Texto-fonte enviado pela IA (quando o roteiro é gerado pelo docmap).
  readonly sourceContent?: string;
  readonly voices: readonly PodcastVoice[];
  readonly status: PodcastStatus;
  readonly error?: string;
  readonly durationMs?: number;
  // True quando o usuário pediu slides visuais. Slides HTML/CSS ficam no
  // filesystem (slides.ts); aqui só vai o mapa de sincronização.
  readonly withSlides?: boolean;
  readonly slideMap?: readonly SlideMapEntry[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

// Lista sem os campos pesados (script, sourceContent) — padrão dos demais
// módulos. Mantém slideMap porque é leve e a UI precisa para sincronizar.
export type PodcastPreview = Omit<Podcast, 'script' | 'sourceContent'>;

export type GeneratePodcastInput = {
  readonly title: string;
  // XOR: `content` → docmap gera o roteiro via provider configurado;
  // `script` → roteiro pronto com tags, docmap só sintetiza o áudio.
  readonly content?: string;
  readonly script?: string;
  readonly folder?: string;
  readonly tags?: readonly string[];
  // Mínimo 2 personas com vozes distintas. Omitido → escolha aleatória.
  readonly voices?: readonly PodcastVoice[];
  // True → docmap também gera slides (HTML/CSS) sincronizados com o áudio.
  // Sem efeito se `script` vier pronto sem blocos <Slide>; o docmap
  // apenas falha gracioso (slideMap vazio) nesse caso.
  readonly withSlides?: boolean;
  // Slides prontos (vindos de API externa). Ignorado se withSlides é
  // falso/ausente. Quando presentes, o docmap escreve no filesystem sem
  // chamar a LLM.
  readonly slides?: readonly Slide[];
};

export type UpdatePodcastInput = {
  readonly title?: string;
  readonly folder?: string;
  readonly tags?: readonly string[];
};

// Patch interno usado pelo pipeline durante a geração.
export type GenerationPatch = {
  readonly script?: string;
  readonly status?: PodcastStatus;
  readonly error?: string;
  readonly durationMs?: number;
  readonly slideMap?: readonly SlideMapEntry[];
};
