// ════ Vozes Edge TTS disponíveis para podcasts ════
// Consulta o edge-tts dinamicamente (`edge-tts --list-voices`) em vez de
// hardcodar uma lista que desatualiza. Filtra pt-BR, es-* e en-* automaticamente.
// O resultado é cacheado em memória; chame refreshVoices() para forçar recarga.

import { EDGE_TTS_BIN } from '../config.ts';
import type { PodcastVoice } from './types.ts';

export type EdgeVoice = {
  readonly id: string;
  readonly gender: 'M' | 'F';
  readonly style: string;
};

// ── Cache em memória ──
let cachedVoices: EdgeVoice[] | null = null;

// Regex de validação: pt-BR, es-* e en-* (ex.: en-US-AriaNeural, es-MX-DaliaNeural)
const VOICE_ID_RE =
  /^(pt-BR|es-[A-Z]{2}|en-[A-Z]{2})-[A-Za-z]+(Multilingual)?Neural$/;

export const DEFAULT_FOLDER = 'geral';

// ── Parser da tabela `edge-tts --list-voices` ──
// Formato:
//   Name                               Gender    ContentCategories      VoicePersonalities
//   ---------------------------------  --------  ---------------------  --------------------------------------
//   pt-BR-AntonioNeural                Male      General                Friendly, Positive

const VOICE_LINE_RE =
  /^((?:pt-BR|es-[A-Z]{2}|en-[A-Z]{2})-\S+Neural)\s+(Male|Female)\s+\S+\s+(.+?)\s*$/;

const parseVoiceList = (stdout: string): EdgeVoice[] => {
  const voices: EdgeVoice[] = [];
  for (const line of stdout.split('\n')) {
    const m = VOICE_LINE_RE.exec(line);
    if (!m) continue;
    const [, id, gender, style] = m;
    voices.push({ id, gender: gender === 'Male' ? 'M' : 'F', style });
  }
  return voices;
};

// Chama edge-tts e faz parse da saída.
const fetchFromEdgeTts = async (): Promise<EdgeVoice[]> => {
  const cmd = new Deno.Command(EDGE_TTS_BIN, {
    args: ['--list-voices'],
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    const msg = new TextDecoder().decode(stderr).trim();
    throw new Error(`edge-tts --list-voices falhou: ${msg}`);
  }
  return parseVoiceList(new TextDecoder().decode(stdout));
};

// Retorna as vozes disponíveis (cache em memória). Use refreshVoices() para forçar recarga.
export const getVoices = async (): Promise<readonly EdgeVoice[]> => {
  if (!cachedVoices) {
    cachedVoices = await fetchFromEdgeTts();
  }
  return cachedVoices;
};

// Força recarga da lista de vozes (ex.: após instalar edge-tts).
export const refreshVoices = async (): Promise<readonly EdgeVoice[]> => {
  cachedVoices = await fetchFromEdgeTts();
  return cachedVoices;
};

// Inicializa o cache no boot (não bloqueia — se falhar, tenta de novo na primeira request).
export const warmVoicesCache = (): void => {
  fetchFromEdgeTts()
    .then((v) => {
      cachedVoices = v;
    })
    .catch(() => {/* silencioso — getVoices tentará de novo depois */});
};

// ── Seleção e validação ──

const defaultName = (i: number): string => `Person${i + 1}`;

// Sorteia `count` vozes distintas e alterna gêneros quando possível,
// para o diálogo ficar fácil de distinguir no ouvido.
export const pickRandomVoices = async (count = 2): Promise<PodcastVoice[]> => {
  const all = await getVoices();
  const pool = [...all];
  const picked: EdgeVoice[] = [];
  let wantGender: 'M' | 'F' = Math.random() < 0.5 ? 'M' : 'F';

  while (picked.length < count && pool.length > 0) {
    const candidates = pool.filter((v) => v.gender === wantGender);
    const source = candidates.length > 0 ? candidates : pool;
    const chosen = source[Math.floor(Math.random() * source.length)];
    picked.push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
    wantGender = wantGender === 'M' ? 'F' : 'M';
  }

  return picked.map((v, i) => ({ name: defaultName(i), voice: v.id }));
};

// Valida as personas enviadas pela IA. Retorna mensagem de erro ou null.
// A validação é apenas de formato (regex) — a existência real da voz
// depende do edge-tts instalado na máquina, e só falha na síntese.
export const validateVoices = (
  voices: readonly PodcastVoice[],
): string | null => {
  if (voices.length < 2) return 'mínimo de 2 personas (voices)';

  const names = new Set<string>();
  const ids = new Set<string>();
  for (const v of voices) {
    if (!v.name?.trim()) return 'cada persona precisa de name';
    if (!VOICE_ID_RE.test(v.voice)) {
      return `voz inválida: ${v.voice} (use GET /podcasts/voices)`;
    }
    if (names.has(v.name)) return `nome de persona duplicado: ${v.name}`;
    if (ids.has(v.voice)) return `voz repetida em personas: ${v.voice}`;
    names.add(v.name);
    ids.add(v.voice);
  }
  return null;
};
