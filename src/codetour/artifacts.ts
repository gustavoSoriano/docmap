// Artefatos selecionáveis do caderno (estilo NotebookLM).
// Inline (vão no JSON dos reels, todos OPCIONAIS): bubble, mindmap,
// diagrams, tables. Externos (vão como links): audio, podcast.
import type { ReelVisualKind } from './types.ts';

export const ARTIFACTS = [
  'audio',
  'podcast',
  'bubble',
  'mindmap',
  'diagrams',
  'tables',
] as const;

export type ArtifactKind = (typeof ARTIFACTS)[number];

export const isArtifact = (v: unknown): v is ArtifactKind =>
  typeof v === 'string' && (ARTIFACTS as readonly string[]).includes(v);

export const normalizeArtifacts = (v: unknown): ArtifactKind[] => {
  if (!Array.isArray(v)) return [...ARTIFACTS];
  const out: ArtifactKind[] = [];
  for (const item of v) {
    if (isArtifact(item) && !out.includes(item)) out.push(item);
  }
  return out;
};

// Artefatos inline viram a PALETA PERMITIDA de visuais (nunca obrigatória):
// a IA usa só o que está marcado, e só quando a ideia pede.
export const allowedVisualKinds = (
  artifacts: readonly ArtifactKind[],
): readonly ReelVisualKind[] => {
  const kinds: ReelVisualKind[] = [];
  if (artifacts.includes('diagrams')) kinds.push('mermaid');
  if (artifacts.includes('mindmap')) kinds.push('mindmap');
  if (artifacts.includes('tables')) kinds.push('html');
  if (artifacts.includes('bubble')) kinds.push('bubble');
  return kinds;
};
