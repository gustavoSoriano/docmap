// ════ Armazenamento do áudio no filesystem ════
// Único módulo do domínio que escreve arquivos fora do KV.
// Local: <dataDir>/podcasts/<id>.mp3 — sobrevive a updates do app.

import { podcastsDir } from '../config.ts';

export const audioPath = (id: string): string => `${podcastsDir()}/${id}.mp3`;

export const ensureAudioDir = async (): Promise<void> => {
  await Deno.mkdir(podcastsDir(), { recursive: true });
};

export const audioStat = async (id: string): Promise<Deno.FileInfo | null> => {
  try {
    return await Deno.stat(audioPath(id));
  } catch {
    return null;
  }
};

export const deleteAudio = async (id: string): Promise<void> => {
  await Deno.remove(audioPath(id)).catch(() => {});
};
