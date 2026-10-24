// ════ Pacote de contexto — o que o agente precisa para não perder o fio ════
// Função pura: recebe tudo já carregado e devolve markdown curto. O briefing
// de cada bloco deixa de repetir playbook: guardrails e refs vêm daqui.

import type {
  AttentionItem,
  ResolvedRef,
  TrilhaDetail,
  TrilhaNode,
} from './types.ts';

export type GuardrailText = {
  readonly title: string;
  readonly content: string;
};

export type ContextInput = {
  readonly detail: TrilhaDetail;
  readonly guardrails: readonly GuardrailText[];
  readonly node?: TrilhaNode;
  readonly api: string;
};

const clip = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max)}…` : text;

const fetchHint = (r: ResolvedRef): string => {
  switch (r.kind) {
    case 'note':
      return `GET /notes/${r.targetId}`;
    case 'skill':
      return `GET /skills/${r.targetId}`;
    case 'macro':
      return `POST /macros/${r.targetId}/invoke`;
    case 'podcast':
      return `GET /podcasts/${r.targetId}`;
    case 'favorite':
      return r.extra?.url ?? `GET /favorites/${r.targetId}`;
  }
};

const refLine = (r: ResolvedRef): string =>
  `- [${r.kind}] ${r.title} — ${fetchHint(r)}`;

const attentionLine = (a: AttentionItem): string =>
  `- ${a.kind}${a.nodeId ? ` (bloco ${a.nodeId.slice(0, 8)})` : ''}: ${
    clip(a.text, 160)
  }`;

const operating = (api: string, trilhaId: string): string[] => {
  const base = `${api}/trilhas/${trilhaId}`;
  return [
    '## Como operar',
    `- Assumir: POST ${base}/nodes/<id>/claim {"by":"<seu-nome>"}; heartbeat a cada ~2min em .../heartbeat`,
    `- Travou ou precisa de decisão: POST ${base}/signals {"kind":"blocker|warning|question|pending","text":"…","nodeId":"<id>","by":"<seu-nome>"}`,
    `- Entregar: PUT ${base}/nodes/<id> {"result":"…","status":"done","by":"<seu-nome>"} (briefing em details nunca se sobrescreve)`,
    `- Próximo: GET ${base}/next?by=<seu-nome>`,
  ];
};

const nodeSection = (input: ContextInput, node: TrilhaNode): string[] => {
  const { detail } = input;
  const byId = new Map(detail.nodes.map((n) => [n.id, n]));
  const deps = detail.edges.filter((e) => e.toNodeId === node.id)
    .map((e) => byId.get(e.fromNodeId)).filter((n): n is TrilhaNode => !!n);
  const refs = detail.refs.filter((r) => r.nodeId === node.id);
  const signals = detail.attention.filter((a) => a.nodeId === node.id);
  const lines = [`## Seu bloco: ${node.title} (id: ${node.id})`];
  if (node.group) lines.push(`Grupo: ${node.group}`);
  lines.push(`Status: ${node.status}`);
  if (node.details.trim()) lines.push('', '### Briefing', node.details.trim());
  if (node.doneCriteria.length) {
    lines.push('', '### Critérios de pronto');
    for (const c of node.doneCriteria) {
      lines.push(`- [${c.done ? 'x' : ' '}] ${c.text}`);
    }
  }
  if (deps.length) {
    lines.push('', '### Resultado das dependências');
    for (const d of deps) {
      lines.push(
        `- ${d.title}: ${clip(d.result.trim() || '(sem relatório)', 400)}`,
      );
    }
  }
  if (refs.length) {
    lines.push('', '### Referências do bloco', ...refs.map(refLine));
  }
  if (signals.length) {
    lines.push('', '### Sinais abertos', ...signals.map(attentionLine));
  }
  return lines;
};

const overview = (detail: TrilhaDetail): string[] => {
  const h = detail.health;
  const lines = [
    '## Estado',
    `${h.done}/${h.total} prontos · ${h.doing} fazendo · ${h.blocked} bloqueados · ${h.readyForAi} prontos para agente`,
  ];
  if (detail.attention.length) {
    lines.push(
      '',
      '### Atenção',
      ...detail.attention.slice(0, 12).map(attentionLine),
    );
  }
  return lines;
};

export const buildContextPack = (input: ContextInput): string => {
  const { detail, guardrails, node, api } = input;
  const { trilha } = detail;
  const lines = [
    `# Trilha: ${trilha.title} (id: ${trilha.id})`,
    '',
    `Objetivo: ${trilha.objective}`,
  ];
  if (trilha.description.trim()) {
    lines.push('', `Contexto: ${trilha.description.trim()}`);
  }
  if (trilha.tags.length) lines.push('', `Tags: ${trilha.tags.join(', ')}`);
  if (guardrails.length) {
    lines.push('', '## Guardrails (obrigatórios)');
    for (const g of guardrails) {
      lines.push(`### ${g.title}`, clip(g.content.trim(), 1500));
    }
  }
  lines.push('', ...(node ? nodeSection(input, node) : overview(detail)));
  const shared = detail.refs.filter((r) => !r.nodeId && r.role !== 'guardrail');
  if (shared.length) {
    lines.push('', '## Arsenal da trilha', ...shared.map(refLine));
  }
  lines.push('', ...operating(api, trilha.id));
  return lines.join('\n');
};
