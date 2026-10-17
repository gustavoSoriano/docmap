// Ponte caderno → podcast (pura): costura as narrations dos reels num
// roteiro de diálogo <Guia>/<Explorador>. O handler valida, cria o podcast
// e dispara o pipeline existente. Personas fixas p/ roteiro determinístico.
import type { CodeReel } from '../codetour/types.ts';

export const NOTEBOOK_PERSONAS = ['Guia', 'Explorador'] as const;

const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();

// Um segmento por reel (limite do parser do podcast) + abertura e fecho.
export const buildNotebookPodcastScript = (reel: CodeReel): string => {
  const parts: string[] = [
    `<Guia>${clean(`Hoje a gente repassa ${reel.topic}. ${reel.goal}`)}</Guia>`,
    `<Explorador>${clean('Fechado. Por onde a gente começa?')}</Explorador>`,
  ];
  for (const r of reel.reels) {
    parts.push(`<Guia>${clean(r.narration)}</Guia>`);
    const bridge = r.rule?.text?.trim() || r.sub?.trim() || r.title;
    if (bridge) {
      parts.push(
        `<Explorador>${clean(`Deixa eu resumir: ${bridge}`)}</Explorador>`,
      );
    }
  }
  parts.push(
    `<Explorador>${
      clean('E qual é o próximo passo depois desse repasse?')
    }</Explorador>`,
    `<Guia>${clean(`Revisar ${reel.topic} lendo o código na ordem.`)}</Guia>`,
  );
  return parts.join('\n');
};
