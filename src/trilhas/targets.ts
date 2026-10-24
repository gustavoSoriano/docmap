// ════ Alvos das referências — leitura nos stores dos outros módulos ════
// A trilha só guarda (kind, targetId). Título, tags e conteúdo vêm sempre do
// artefato original: editou lá, reflete aqui (sem cópia, sem drift).

import { getNoteById } from '../notes/store.ts';
import { getSkillById } from '../skills/store.ts';
import { getMacroById } from '../macros/store.ts';
import { getPodcastById } from '../podcasts/store.ts';
import { getFavoriteById } from '../favorites/store.ts';
import type { RefKind, ResolvedRef, TrilhaRef } from './types.ts';

export type TargetMeta = {
  readonly title: string;
  readonly tags: readonly string[];
  readonly content?: string;
  readonly extra?: Readonly<Record<string, string>>;
};

export const loadTarget = async (
  kv: Deno.Kv,
  kind: RefKind,
  id: string,
): Promise<TargetMeta | null> => {
  switch (kind) {
    case 'note': {
      const n = await getNoteById(kv, id);
      return n ? { title: n.title, tags: n.tags, content: n.content } : null;
    }
    case 'skill': {
      const s = await getSkillById(kv, id);
      return s
        ? {
          title: s.title,
          tags: s.tags,
          content: s.content,
          extra: { name: s.name },
        }
        : null;
    }
    case 'macro': {
      const m = await getMacroById(kv, id);
      return m
        ? {
          title: m.title,
          tags: m.tags,
          extra: { name: m.name, inputLabel: m.inputLabel ?? '' },
        }
        : null;
    }
    case 'podcast': {
      const p = await getPodcastById(kv, id);
      return p
        ? { title: p.title, tags: p.tags, extra: { status: p.status } }
        : null;
    }
    case 'favorite': {
      const f = await getFavoriteById(kv, id);
      return f ? { title: f.title, tags: f.tags, extra: { url: f.url } } : null;
    }
  }
};

export const resolveRefs = (
  kv: Deno.Kv,
  refs: readonly TrilhaRef[],
): Promise<ResolvedRef[]> =>
  Promise.all(refs.map(async (ref): Promise<ResolvedRef> => {
    const meta = await loadTarget(kv, ref.kind, ref.targetId);
    if (!meta) return { ...ref, title: '(removido)', tags: [], missing: true };
    return {
      ...ref,
      title: meta.title,
      tags: meta.tags,
      ...(meta.extra ? { extra: meta.extra } : {}),
    };
  }));
