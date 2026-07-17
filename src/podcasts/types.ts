// ════ Tipos do módulo de podcasts ════
// Metadados ficam no KV; o áudio (MP3) fica no filesystem (ver audio.ts).

export type PodcastStatus = 'generating' | 'ready' | 'error';

// Uma persona do diálogo: `name` é a tag usada no roteiro (<Person1>),
// `voice` é o id da voz do Edge TTS (pt-BR-AntonioNeural).
export type PodcastVoice = {
  readonly name: string;
  readonly voice: string;
};

export type Podcast = {
  readonly id: string;
  readonly title: string;
  readonly folder: string;
  // Roteiro com tags <Nome>…</Nome>. Vazio até a LLM gerar (quando o
  // pedido veio com `content` em vez de roteiro pronto).
  readonly script: string;
  // Texto-fonte enviado pela IA (quando o roteiro é gerado pelo docmap).
  readonly sourceContent?: string;
  readonly voices: readonly PodcastVoice[];
  readonly status: PodcastStatus;
  readonly error?: string;
  readonly durationMs?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

// Lista sem o campo pesado (script) — padrão dos demais módulos.
export type PodcastPreview = Omit<Podcast, 'script' | 'sourceContent'>;

export type GeneratePodcastInput = {
  readonly title: string;
  // XOR: `content` → docmap gera o roteiro via provider configurado;
  // `script` → roteiro pronto com tags, docmap só sintetiza o áudio.
  readonly content?: string;
  readonly script?: string;
  readonly folder?: string;
  // Mínimo 2 personas com vozes distintas. Omitido → escolha aleatória.
  readonly voices?: readonly PodcastVoice[];
};

export type UpdatePodcastInput = {
  readonly title?: string;
  readonly folder?: string;
};

// Patch interno usado pelo pipeline durante a geração.
export type GenerationPatch = {
  readonly script?: string;
  readonly status?: PodcastStatus;
  readonly error?: string;
  readonly durationMs?: number;
};
