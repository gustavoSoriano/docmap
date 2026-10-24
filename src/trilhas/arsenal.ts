// ════ Arsenal — o acervo do docmap visto pela trilha ════
// Sugere por TAG (a tag da trilha é o eixo do grafo) e mostra o que já está
// fixado. Com `q`, procura em todo o acervo para anexar algo fora da tag.

import { listNotes } from '../notes/store.ts';
import { listSkills } from '../skills/store.ts';
import { listMacros } from '../macros/store.ts';
import { listPodcasts } from '../podcasts/store.ts';
import { listFavorites } from '../favorites/store.ts';
import { normalizeTags } from '../tags/normalize.ts';
import type { RefKind, RefRole, Trilha, TrilhaRef } from './types.ts';

export const GUARDRAIL_TAG = 'i-guardrail';

export type ArsenalItem = {
  readonly kind: RefKind;
  readonly id: string;
  readonly title: string;
  readonly tags: readonly string[];
  readonly via: 'pin' | 'tag' | 'search';
  readonly pinned: boolean;
  readonly refId?: string;
  readonly role?: RefRole;
  readonly extra?: Readonly<Record<string, string>>;
};

export type Arsenal = {
  readonly guardrails: readonly ArsenalItem[];
  readonly skills: readonly ArsenalItem[];
  readonly macros: readonly ArsenalItem[];
  readonly notes: readonly ArsenalItem[];
  readonly podcasts: readonly ArsenalItem[];
  readonly favorites: readonly ArsenalItem[];
};

type Candidate = {
  readonly kind: RefKind;
  readonly id: string;
  readonly title: string;
  readonly tags: readonly string[];
  readonly extra?: Readonly<Record<string, string>>;
};

const SEARCH_CAP = 40;

const loadCandidates = async (kv: Deno.Kv): Promise<Candidate[]> => {
  const [notes, skills, macros, podcasts, favs] = await Promise.all([
    listNotes(kv),
    listSkills(kv),
    listMacros(kv),
    listPodcasts(kv),
    listFavorites(kv),
  ]);
  return [
    ...notes.map((n) => ({
      kind: 'note' as const,
      id: n.id,
      title: n.title,
      tags: n.tags,
    })),
    ...skills.map((s) => ({
      kind: 'skill' as const,
      id: s.id,
      title: s.title,
      tags: s.tags,
      extra: { name: s.name },
    })),
    ...macros.map((m) => ({
      kind: 'macro' as const,
      id: m.id,
      title: m.title,
      tags: m.tags,
      extra: { name: m.name, inputLabel: m.inputLabel ?? '' },
    })),
    ...podcasts.map((p) => ({
      kind: 'podcast' as const,
      id: p.id,
      title: p.title,
      tags: p.tags,
    })),
    ...favs.map((f) => ({
      kind: 'favorite' as const,
      id: f.id,
      title: f.title,
      tags: f.tags,
      extra: { url: f.url },
    })),
  ];
};

// Busca por título, nome (slug) ou tag. A tag é comparada na forma-slug:
// "#Focal", "i guardrail" e "focal" casam com as tags "focal" e "i-guardrail".
const matchesQuery = (c: Candidate, q: string): boolean => {
  const text = q.replace(/^#/, '').trim().toLowerCase();
  const [slug] = normalizeTags([text]);
  return c.title.toLowerCase().includes(text) ||
    (c.extra?.name ?? '').toLowerCase().includes(text) ||
    (!!slug && c.tags.some((t) => t.includes(slug)));
};

const isTagGuardrail = (
  c: Candidate,
  trilhaTags: ReadonlySet<string>,
): boolean =>
  c.kind === 'note' && c.tags.includes(GUARDRAIL_TAG) &&
  c.tags.some((t) => trilhaTags.has(t));

// Sem `q`: só o que já vale para a trilha (fixados + guardrails ativos por tag).
// Com `q`: o que casa com a busca, no acervo todo — nada é listado de graça.
export const buildArsenal = async (
  kv: Deno.Kv,
  trilha: Trilha,
  refs: readonly TrilhaRef[],
  q?: string,
): Promise<Arsenal> => {
  const pins = new Map(
    refs.filter((r) => !r.nodeId).map((r) => [`${r.kind}:${r.targetId}`, r]),
  );
  const query = q?.trim().toLowerCase();
  const trilhaTags = new Set(trilha.tags);
  const items: ArsenalItem[] = [];
  for (const c of await loadCandidates(kv)) {
    const pin = pins.get(`${c.kind}:${c.id}`);
    const guard = isTagGuardrail(c, trilhaTags);
    if (query ? !matchesQuery(c, query) : !pin && !guard) continue;
    if (query && items.length >= SEARCH_CAP) break;
    items.push({
      ...c,
      via: pin ? 'pin' : guard ? 'tag' : 'search',
      pinned: !!pin,
      ...(pin ? { refId: pin.id, role: pin.role } : {}),
    });
  }
  const isGuardrail = (i: ArsenalItem): boolean =>
    i.kind === 'note' &&
    (i.role === 'guardrail' || i.tags.includes(GUARDRAIL_TAG));
  const of = (kind: RefKind) =>
    items.filter((i) => i.kind === kind && !isGuardrail(i));
  return {
    guardrails: items.filter(isGuardrail),
    skills: of('skill'),
    macros: of('macro'),
    notes: of('note'),
    podcasts: of('podcast'),
    favorites: of('favorite'),
  };
};
