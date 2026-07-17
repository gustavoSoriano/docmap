// ════ Configuração central do app ════

export const APP_VERSION = '1.0.0';

// Repositório GitHub usado para auto-update (owner/repo).
// Pode ser sobrescrito pela env DOCMAP_REPO.
export const GITHUB_REPO = Deno.env.get('DOCMAP_REPO') ??
  'gustavosoriano/docmap';

const APP_DIR_NAME = 'docmap';

// Diretório de dados próprio do app, estável entre versões/builds.
// macOS:   ~/Library/Application Support/docmap
// Linux:   $XDG_DATA_HOME/docmap  ou  ~/.local/share/docmap
// Windows: %APPDATA%\docmap
export const dataDir = (): string => {
  const home = Deno.env.get('HOME') ?? Deno.env.get('USERPROFILE') ?? '.';
  switch (Deno.build.os) {
    case 'darwin':
      return `${home}/Library/Application Support/${APP_DIR_NAME}`;
    case 'windows':
      return `${Deno.env.get('APPDATA') ?? home}\\${APP_DIR_NAME}`;
    default: {
      const xdg = Deno.env.get('XDG_DATA_HOME');
      return xdg
        ? `${xdg}/${APP_DIR_NAME}`
        : `${home}/.local/share/${APP_DIR_NAME}`;
    }
  }
};

export const kvPath = (): string => `${dataDir()}/data.sqlite3`;

// ════ AI providers ════
// Ollama roda localmente (default). DeepSeek é OpenAI-compatible na nuvem.

export const OLLAMA_URL = 'http://localhost:11434/api/chat';
export const OLLAMA_MODEL = Deno.env.get('DOCMAP_OLLAMA_MODEL') ?? 'gemma4:12b';
export const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
export const DEEPSEEK_MODEL = Deno.env.get('DOCMAP_DEEPSEEK_MODEL') ??
  'deepseek-v4-flash';
// A chave NUNCA vai para o frontend — só o adapter do backend a lê.
export const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') ?? '';

// ════ Podcasts ════
// Áudio MP3 fica fora do KV (limite de tamanho por valor), junto do data dir.
export const podcastsDir = (): string => `${dataDir()}/podcasts`;

// Binários externos usados na síntese/concatenação de áudio.
// edge-tts: CLI Python (pip install edge-tts). ffmpeg/ffprobe: brew install ffmpeg.
export const EDGE_TTS_BIN = Deno.env.get('DOCMAP_EDGE_TTS') ?? 'edge-tts';
export const FFMPEG_BIN = Deno.env.get('DOCMAP_FFMPEG') ?? 'ffmpeg';
export const FFPROBE_BIN = Deno.env.get('DOCMAP_FFPROBE') ?? 'ffprobe';
