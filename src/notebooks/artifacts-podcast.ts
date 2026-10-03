// Ponte caderno → podcast (pura): costura as narrations dos slides num
// roteiro de diálogo <Guia>/<Explorador>. O handler valida, cria o podcast
// e dispara o pipeline existente. Personas fixas p/ roteiro determinístico.
import type { CodeTour } from '../codetour/types.ts';

export const NOTEBOOK_PERSONAS = ['Guia', 'Explorador'] as const;

const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();

// Um segmento por slide (limite do parser do podcast) + abertura e fecho.
export const buildNotebookPodcastScript = (tour: CodeTour): string => {
  const parts: string[] = [
    `<Guia>${clean(`Hoje a gente repassa ${tour.topic}. ${tour.goal}`)}</Guia>`,
    `<Explorador>${clean('Fechado. Por onde a gente começa?')}</Explorador>`,
  ];
  for (const s of tour.slides) {
    parts.push(`<Guia>${clean(s.narration)}</Guia>`);
    if (s.check.trim()) {
      parts.push(
        `<Explorador>${
          clean(`Deixa eu ver se entendi: ${s.check}`)
        }</Explorador>`,
      );
      const proof = s.bullets[0]?.trim() ?? s.title;
      parts.push(`<Guia>${clean(`Isso. ${proof}`)}</Guia>`);
    }
  }
  parts.push(
    `<Explorador>${
      clean('E qual é o próximo passo depois desse repasse?')
    }</Explorador>`,
    `<Guia>${
      clean(tour.nextSteps[0] ?? `Revisar ${tour.topic} amanhã.`)
    }</Guia>`,
  );
  return parts.join('\n');
};
