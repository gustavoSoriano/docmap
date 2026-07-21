// ════ Armazenamento dos slides no filesystem ════
// Único módulo (além de audio.ts) que escreve arquivos fora do KV.
// Local: <dataDir>/podcasts/<id>/slides.html — sobrevive a updates do app.
//
// O documento é um único HTML contendo uma <section data-slide="N"> por
// slide, com <style> escopado por .slide-N. A UI carrega via fetch e
// injeta em Shadow DOM para isolamento total do CSS.

import { podcastsDir } from '../config.ts';
import type { Slide } from './types.ts';

export const slidesDir = (id: string): string => `${podcastsDir()}/${id}`;
export const slidesPath = (id: string): string =>
  `${slidesDir(id)}/slides.html`;

export const ensureSlidesDir = async (id: string): Promise<void> => {
  await Deno.mkdir(slidesDir(id), { recursive: true });
};

const escAttr = (s: string): string =>
  s.replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Monta o documento HTML único com todas as seções.
// Cada section carrega:
//   - data-slide="N"           → índice (1-based)
//   - data-title="…"           → título (acessibilidade)
//   - data-transition="…"      → dica semântica (CSS decide o efeito real)
//   - <style>                  → CSS do slide, escopado por .slide-N
//   - <div class="slide-body"> → raiz do markup do slide
//
// A UI adiciona data-state="entering"|"active"|"leaving"|"hidden" em
// tempo de execução; o CSS do slide reage a esses estados para animar.
export const writeSlides = async (
  id: string,
  slides: readonly Slide[],
): Promise<void> => {
  await ensureSlidesDir(id);
  const sections = slides.map((s) => {
    const attrs = [
      `data-slide="${s.index}"`,
      `data-title="${escAttr(s.title)}"`,
      ...(s.transition ? [`data-transition="${escAttr(s.transition)}"`] : []),
    ].join(' ');
    return `<section ${attrs} data-state="hidden">
<style>
${s.css}
</style>
<div class="slide-body slide-${s.index}">
${s.html}
</div>
</section>`;
  }).join('\n\n');

  const doc = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Slides</title>
<style>
/* Estilos do host — só estrutura. Tema vem do CSS de cada slide. */
:host, html, body { margin: 0; padding: 0; }
#slides-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}
#slides-root > section {
  position: absolute;
  inset: 0;
  display: none;
}
#slides-root > section[data-state="entering"],
#slides-root > section[data-state="active"],
#slides-root > section[data-state="leaving"] {
  display: block;
}
</style>
</head>
<body>
<div id="slides-root">
${sections}
</div>
</body>
</html>`;
  await Deno.writeTextFile(slidesPath(id), doc);
};

export const readSlides = async (id: string): Promise<string | null> => {
  try {
    return await Deno.readTextFile(slidesPath(id));
  } catch {
    return null;
  }
};

// True quando o documento HTML existe e não está vazio.
export const slidesExists = async (id: string): Promise<boolean> => {
  try {
    const stat = await Deno.stat(slidesPath(id));
    return stat.isFile && stat.size > 0;
  } catch {
    return false;
  }
};

export const deleteSlides = async (id: string): Promise<void> => {
  await Deno.remove(slidesDir(id), { recursive: true }).catch(() => {});
};
