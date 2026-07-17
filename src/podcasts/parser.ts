// ════ Parser do roteiro em falas ════
// Função pura: <Person1>olá</Person1> → { speaker: 'Person1', text: 'olá' }

import type { PodcastVoice } from './types.ts';

export type Segment = {
  readonly speaker: string;
  readonly text: string;
};

const TAG_RE = /<([A-Za-z][A-Za-z0-9_-]*)>([\s\S]*?)<\/\1>/g;

export const parseScript = (script: string): Segment[] => {
  const segments: Segment[] = [];
  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(script)) !== null) {
    const text = match[2].trim();
    if (text) segments.push({ speaker: match[1], text });
  }
  return segments;
};

// Valida que o roteiro casa com as personas. Retorna mensagem de erro ou null.
export const validateSegments = (
  segments: readonly Segment[],
  voices: readonly PodcastVoice[],
): string | null => {
  if (segments.length === 0) {
    return 'roteiro sem falas — use tags <Person1>texto</Person1>';
  }
  const voiceOf = new Map(voices.map((v) => [v.name, v.voice]));
  const speakers = new Set<string>();
  for (const seg of segments) {
    if (!voiceOf.has(seg.speaker)) {
      return `fala de "${seg.speaker}" sem voz mapeada (personas: ${
        voices.map((v) => v.name).join(', ')
      })`;
    }
    speakers.add(seg.speaker);
  }
  if (speakers.size < 2) {
    return 'roteiro usa só 1 persona — podcasts exigem 2+ vozes';
  }
  return null;
};

export const voiceIdOf = (
  voices: readonly PodcastVoice[],
  speaker: string,
): string | undefined => voices.find((v) => v.name === speaker)?.voice;
