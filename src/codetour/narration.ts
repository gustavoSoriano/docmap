// Narração por slide — lookup + cache + síntese sob demanda.
// Não importa de podcasts/*: usa o primitivo compartilhado src/voice/*.
import { hashText } from '../voice/hash.ts';
import { DEFAULT_VOICE, isVoiceId, synthesizeSpeech } from '../voice/synthesize.ts';
import {
  audioPathForHash,
  ensureCodetourDir,
  statNarration,
} from './audio.ts';
import type { CodeTourSession, TourSlide } from './types.ts';

const SLIDE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export const findSlide = (
  session: CodeTourSession | null,
  slideId: string,
): TourSlide | null => {
  if (!session?.tour || !SLIDE_ID_RE.test(slideId)) return null;
  return session.tour.slides.find((s) => s.id === slideId) ?? null;
};

export const narrationHash = (text: string): string => hashText(text.trim());

export const resolveVoice = (raw: string | null): string => {
  const v = (raw ?? '').trim();
  return isVoiceId(v) ? v : DEFAULT_VOICE;
};

// Gera o MP3 se ainda não existe; devolve o hash do cache.
// Lança erro com hint de instalação quando o edge-tts falta.
export const ensureNarrationAudio = async (
  text: string,
  voice: string,
): Promise<string> => {
  const hash = narrationHash(text);
  await ensureCodetourDir();
  const stat = await statNarration(hash);
  if (stat?.size) return hash;
  await synthesizeSpeech(text, voice, audioPathForHash(hash));
  return hash;
};
