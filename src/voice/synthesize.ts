// Síntese de voz compartilhada — primitivo desacoplado.
// Podcasts e codetour importam daqui; nenhum importa do outro.
// Side effect isolado: subprocesso edge-tts + escrita no filesystem.
import { EDGE_TTS_BIN } from '../config.ts';

export const DEFAULT_VOICE = 'pt-BR-AntonioNeural';

// Ids aceitos: pt-BR, es-* e en-* terminados em Neural.
// Validação de formato — a existência real só falha na síntese.
const VOICE_ID_RE =
  /^(pt-BR|es-[A-Z]{2}|en-[A-Z]{2})-[A-Za-z]+(Multilingual)?Neural$/;

export const isVoiceId = (v: unknown): v is string =>
  typeof v === 'string' && VOICE_ID_RE.test(v.trim());

export const synthesizeSpeech = async (
  text: string,
  voice: string,
  outFile: string,
): Promise<void> => {
  const clean = text.trim();
  if (!clean) throw new Error('texto vazio para síntese');
  if (!isVoiceId(voice)) throw new Error(`voz inválida: ${voice}`);
  const cmd = new Deno.Command(EDGE_TTS_BIN, {
    args: [
      '--voice',
      voice.trim(),
      '--text',
      clean,
      '--rate',
      '+8%',
      '--write-media',
      outFile,
    ],
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    const dec = new TextDecoder();
    const detail = dec.decode(stderr).trim() || dec.decode(stdout).trim();
    throw new Error(`edge-tts falhou (voz ${voice}): ${detail}`);
  }
};
