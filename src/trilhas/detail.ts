// ════ Detalhe da trilha — composição de tudo que a UI e o agente leem ════

import { getTrilha } from './store.ts';
import { listNodes } from './nodes.ts';
import { listEdges } from './edges.ts';
import { listStickies } from './stickies.ts';
import { listRefs } from './refs.ts';
import { listSignals } from './signals.ts';
import { resolveRefs } from './targets.ts';
import { buildAttention, buildHealth } from './attention.ts';
import { getNoteById, listNotes } from '../notes/store.ts';
import { GUARDRAIL_TAG } from './arsenal.ts';
import type { GuardrailText } from './context.ts';
import type { TrilhaDetail } from './types.ts';

export const loadTrilhaDetail = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaDetail | null> => {
  const trilha = await getTrilha(kv, id);
  if (!trilha) return null;
  const [nodes, edges, stickies, rawRefs, signals] = await Promise.all([
    listNodes(kv, id),
    listEdges(kv, id),
    listStickies(kv, id),
    listRefs(kv, id),
    listSignals(kv, id),
  ]);
  const refs = await resolveRefs(kv, rawRefs);
  const attention = buildAttention(nodes, edges, signals);
  const health = buildHealth(nodes, edges, signals, attention);
  return { trilha, nodes, edges, stickies, refs, signals, attention, health };
};

// Guardrails = notas fixadas como guardrail + notas com a tag i-guardrail que
// compartilham alguma tag com a trilha. Sempre lidas frescas do acervo.
export const loadGuardrails = async (
  kv: Deno.Kv,
  detail: TrilhaDetail,
): Promise<GuardrailText[]> => {
  const ids = new Set(
    detail.refs.filter((r) =>
      r.kind === 'note' && r.role === 'guardrail' && !r.missing
    )
      .map((r) => r.targetId),
  );
  const tags = new Set(detail.trilha.tags);
  for (const n of await listNotes(kv)) {
    if (n.tags.includes(GUARDRAIL_TAG) && n.tags.some((t) => tags.has(t))) {
      ids.add(n.id);
    }
  }
  const notes = await Promise.all([...ids].map((id) => getNoteById(kv, id)));
  return notes.filter((n) => n !== null)
    .map((n) => ({ title: n.title, content: n.content }));
};
