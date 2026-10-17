// Sessões em memória, uma por caderno — id é o UUID do caderno pendente.
// Múltiplos cadernos podem coexistir: cada import valida contra a SUA sessão.
// Temporário, sem KV, sem arquivo.
import type {
  CodeReel,
  CodeTourSession,
  PublicSession,
  StructurePack,
  TourDepth,
  TourLayer,
} from './types.ts';
import type { ArtifactKind } from './artifacts.ts';
import { ARTIFACTS } from './artifacts.ts';

const sessions = new Map<string, CodeTourSession>();

// Último caderno aberto/importado — fallback p/ agentes sem id no import.
let activeId: string | null = null;

const touch = (s: CodeTourSession): CodeTourSession => ({
  ...s,
  updatedAt: new Date().toISOString(),
});

export const openSession = (
  id: string,
  projectRoot: string,
  query: string,
  depth: TourDepth,
  artifacts?: readonly ArtifactKind[],
): CodeTourSession => {
  const s: CodeTourSession = {
    id,
    projectRoot: projectRoot.trim(),
    query: query.trim(),
    depth,
    artifacts: artifacts ?? [...ARTIFACTS],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reel: null,
    pack: null,
  };
  sessions.set(id, s);
  activeId = id;
  return s;
};

export const getSession = (id?: string | null): CodeTourSession | null => {
  if (id) return sessions.get(id.trim()) ?? null;
  return activeId ? sessions.get(activeId) ?? null : null;
};

export const attachPack = (
  id: string,
  pack: StructurePack,
): CodeTourSession | null => {
  const s = sessions.get(id);
  if (!s) return null;
  const updated = touch({ ...s, pack });
  sessions.set(id, updated);
  return updated;
};

export const attachReel = (
  id: string,
  reel: CodeReel,
): CodeTourSession | null => {
  const s = sessions.get(id);
  if (!s) return null;
  const updated = touch({ ...s, reel });
  sessions.set(id, updated);
  activeId = id;
  return updated;
};

// Sem id → encerra a sessão ativa. Com id → encerra só ela e promove a
// mais recente restante a ativa.
export const clearSession = (id?: string | null): void => {
  if (id) sessions.delete(id.trim());
  else if (activeId) sessions.delete(activeId);
  if (activeId && !sessions.has(activeId)) {
    const last = [...sessions.entries()].sort(
      (a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt),
    )[0];
    activeId = last ? last[1].id : null;
  }
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
    id: s.id,
    projectRoot: s.projectRoot,
    query: s.query,
    depth: s.depth,
    artifacts: s.artifacts,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    reel: s.reel,
    scan: s.pack
      ? { files: s.pack.files.length, truncated: s.pack.truncated }
      : null,
    layers,
  };
};
