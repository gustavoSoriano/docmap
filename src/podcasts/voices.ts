// ════ Vozes Edge TTS disponíveis para podcasts ════
// Lista curada pt-BR. A IA pode escolher da lista (GET /podcasts/voices)
// ou deixar o docmap sortear (pickRandomVoices) — sempre 2+ personas.

import type { PodcastVoice } from './types.ts';

export type EdgeVoice = {
  readonly id: string;
  readonly gender: 'M' | 'F';
  readonly style: string;
};

export const PT_BR_VOICES: readonly EdgeVoice[] = [
  { id: 'pt-BR-AntonioNeural', gender: 'M', style: 'neutro, locução' },
  { id: 'pt-BR-FabioNeural', gender: 'M', style: 'calmo, conversado' },
  { id: 'pt-BR-HumbertoNeural', gender: 'M', style: 'grave, sério' },
  { id: 'pt-BR-JulioNeural', gender: 'M', style: 'jovem, informal' },
  { id: 'pt-BR-NicolauNeural', gender: 'M', style: 'leve, amigável' },
  { id: 'pt-BR-ValerioNeural', gender: 'M', style: 'articulado, claro' },
  { id: 'pt-BR-FranciscaNeural', gender: 'F', style: 'neutro, locução' },
  { id: 'pt-BR-GiovannaNeural', gender: 'F', style: 'empolgada, viva' },
  { id: 'pt-BR-LeilaNeural', gender: 'F', style: 'suave, acolhedora' },
  { id: 'pt-BR-LeticiaNeural', gender: 'F', style: 'calma, didática' },
  { id: 'pt-BR-ManuelaNeural', gender: 'F', style: 'articulada, clara' },
  { id: 'pt-BR-YaraNeural', gender: 'F', style: 'madura, confiante' },
];

const VOICE_ID_RE = /^pt-BR-[A-Za-z]+Neural$/;

export const DEFAULT_FOLDER = 'geral';

const defaultName = (i: number): string => `Person${i + 1}`;

// Sorteia `count` vozes distintas e alterna gêneros quando possível,
// para o diálogo ficar fácil de distinguir no ouvido.
export const pickRandomVoices = (count = 2): PodcastVoice[] => {
  const pool = [...PT_BR_VOICES];
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
