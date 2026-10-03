// Tipos do Caderno — tour salvo com artefatos linkados (estilo NotebookLM).
// Metadados leves no KV; o corpo (tour + paths) vai pro filesystem
// (KV tem limite de ~64 KiB/valor). Ver body-file.ts e store.ts.
import type { ArtifactKind } from '../codetour/artifacts.ts';
import type { CodeTour, TourDepth } from '../codetour/types.ts';

export type NotebookLinks = {
  readonly podcastId: string | null;
  readonly canvasShapeIds: readonly string[];
  readonly canvasAt: string | null;
};

export type NotebookProgress = {
  readonly listened: readonly string[];
  readonly quiz: Readonly<Record<string, 'hit' | 'miss'>>;
};

// Tags do grafo: ['caderno', 'caderno-<id8>'] — a MESMA tag vai no
// podcast gerado, então IA e grafo acham o conjunto pelo hub #caderno-<id8>.
export const notebookTag = (id: string): string => `caderno-${id.slice(0, 8)}`;

export type NotebookMeta = {
  readonly id: string;
  readonly title: string;
  readonly query: string;
  readonly projectRoot: string;
  readonly depth: TourDepth;
  readonly tags: readonly string[];
  readonly artifacts: readonly ArtifactKind[];
  readonly links: NotebookLinks;
  readonly progress: NotebookProgress;
  readonly slides: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

// Corpo persistido em <dataDir>/notebooks/<id>.json.
// paths cobre TODOS os arquivos do scan (p/ validar imports futuros);
// filesTop guarda só o top-80 p/ exibição.
export type NotebookBody = {
  readonly tour: CodeTour;
  readonly paths: readonly string[];
  readonly filesTop: readonly string[];
};

export type NotebookRefs = {
  readonly podcast: boolean;
  readonly canvas: boolean;
  readonly audio: boolean;
};
