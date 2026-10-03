// Sessão única em memória — temporária, sem KV, sem arquivo.
import type {
  CodeTour,
  CodeTourSession,
  PublicSession,
  StructurePack,
  TourDepth,
  TourLayer,
} from './types.ts';
import type { ArtifactKind } from './artifacts.ts';
import { ARTIFACTS } from './artifacts.ts';

let active: CodeTourSession | null = null;

export const getSession = (): CodeTourSession | null => active;

export const openSession = (
  projectRoot: string,
  query: string,
  depth: TourDepth,
  artifacts?: readonly ArtifactKind[],
): CodeTourSession => {
  const now = new Date().toISOString();
  active = {
    projectRoot: projectRoot.trim(),
    query: query.trim(),
    depth,
    artifacts: artifacts ?? [...ARTIFACTS],
    notebookId: null,
    createdAt: now,
    updatedAt: now,
    tour: null,
    pack: null,
  };
  return active;
};

// Id do caderno auto-salvo quando a IA entrega o tour. Nulo até lá.
export const setSessionNotebookId = (id: string | null): void => {
  if (!active) return;
  active = { ...active, notebookId: id, updatedAt: new Date().toISOString() };
};

export const attachPack = (pack: StructurePack): CodeTourSession | null => {
  if (!active) return null;
  active = { ...active, pack, updatedAt: new Date().toISOString() };
  return active;
};

export const attachTour = (tour: CodeTour): CodeTourSession | null => {
  if (!active) return null;
  active = { ...active, tour, updatedAt: new Date().toISOString() };
  return active;
};

export const clearSession = (): void => {
  active = null;
};

// Visão pública: sem o pack (vai em GET /codetour/structure).
export const publicSession = (
  s: CodeTourSession | null,
): PublicSession | null => {
  if (!s) return null;
  const layers: Record<string, TourLayer> = {};
  if (s.pack) {
    for (const f of s.pack.files) layers[f.path] = f.layer;
  }
  return {
    projectRoot: s.projectRoot,
    query: s.query,
    depth: s.depth,
    artifacts: s.artifacts,
    notebookId: s.notebookId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    tour: s.tour,
    scan: s.pack
      ? { files: s.pack.files.length, truncated: s.pack.truncated }
      : null,
    layers,
  };
};
