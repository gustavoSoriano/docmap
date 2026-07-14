import { streamChat } from '../ai/adapters/provider.ts';
import { getProvider } from '../ai/store.ts';
import type { Provider } from '../ai/types.ts';
import type { WorkspaceContext } from './analyzer.ts';
import type {
  DiataxisDepth,
  DiataxisEntityKind,
  SuggestedDocSet,
  SuggestedItem,
} from './types.ts';

const SYSTEM_PROMPT = `Você é um organizador de documentação especialista no framework Diátaxis.

Seu trabalho é analisar um workspace e produzir uma visão Diátaxis completa para um propósito específico.

O framework Diátaxis divide a documentação em 4 quadrantes:
- tutorial: leva alguém do zero até a primeira experiência prática guiada.
- how-to: guia para resolver uma tarefa real específica.
- reference: material de consulta factual (env vars, comandos, endpoints, etc.).
- explanation: aprofunda o entendimento do porquê, contexto e decisões.

Você receberá:
1. O propósito da visão
2. O público-alvo (opcional)
3. A profundidade desejada (quick, complete, deep)
4. Uma lista de recursos existentes no workspace (arquivos .md, notas, skills, macros, diagramas, tasks, mocks, favoritos)

Para cada recurso existente, decida se ele serve ao propósito e em qual quadrante se encaixa. Use action "reference".

Se faltar algum quadrante para cobrir o propósito, crie novos itens com action "create". Os tipos de entidade que podem ser criados são: note, skill, macro, diagram, task.

Para cada item criado, forneça proposedContent seguindo o formato apropriado:
- note: { title, content, category?, tags? }
- skill: { name, title, description, content, tags? }
- macro: { name, title, description?, script }
- diagram: { title, source }
- task: { title, description?, status? }

**Importante: notas do tipo tutorial devem usar HTML no campo content.** Não use apenas markdown. Estruture o tutorial com tags semânticas (\`h1\`, \`h2\`, \`p\`, \`ul\`, \`ol\`, \`li\`, \`details\`, \`summary\`, \`table\`, etc.) e, quando útil, estilos inline usando as variáveis CSS do DocMap (\`var(--accent)\`, \`var(--surface-2)\`, \`var(--border)\`, \`var(--text-2)\`). O objetivo é um tutorial visualmente rico e guiado.

Responda APENAS com um JSON válido e nada mais — sem markdown, sem explicações fora do JSON. O JSON deve seguir exatamente este schema:

{
  "title": "string",
  "purpose": "string",
  "audience": "string | undefined",
  "depth": "quick | complete | deep",
  "items": [
    {
      "type": "tutorial | how-to | reference | explanation",
      "action": "reference | create",
      "ref": { "kind": "file|note|skill|macro|diagram|task|mock|favorite", "id": "string" }, // obrigatório se action=reference
      "entityKind": "note|skill|macro|diagram|task", // obrigatório se action=create
      "proposedTitle": "string", // opcional, para exibição
      "proposedContent": { ... }, // obrigatório se action=create
      "reason": "string",
      "userQuestion": "string"
    }
  ]
}

Regras:
- Se action for "reference", ref é obrigatório.
- Se action for "create", entityKind e proposedContent são obrigatórios.
- reason deve explicar por que o item foi classificado assim.
- userQuestion deve ser a pergunta do usuário que este item responde.
- Não invente IDs. Use apenas IDs que aparecerem no contexto fornecido para referências.
- Mantenha o foco no propósito. Não inclua recursos que não ajudem a atingir o propósito.
- Se a profundidade for "quick", seja enxuto. Se for "deep", seja abrangente.`;

const buildUserPrompt = (
  context: WorkspaceContext,
  purpose: string,
  audience: string | undefined,
  depth: DiataxisDepth,
  allowCreation: boolean,
): string => {
  const sections = [
    `Propósito: ${purpose}`,
    audience ? `Público-alvo: ${audience}` : '',
    `Profundidade: ${depth}`,
    `Pode criar novas entidades: ${allowCreation ? 'sim' : 'não'}`,
    '',
    'Recursos disponíveis no workspace:',
  ];

  const pushSection = (name: string, items: readonly { id: string; title: string; description?: string }[]) => {
    if (!items.length) return;
    sections.push(`\n## ${name}`);
    for (const item of items) {
      sections.push(`- id: ${item.id} | title: ${item.title}${item.description ? ` | description: ${item.description}` : ''}`);
    }
  };

  pushSection('Arquivos .md', context.files);
  pushSection('Notas', context.notes);
  pushSection('Skills', context.skills);
  pushSection('Macros', context.macros);
  pushSection('Diagramas', context.diagrams);
  pushSection('Tasks', context.tasks);
  pushSection('Mocks', context.mocks);
  pushSection('Favoritos', context.favorites);

  return sections.filter(Boolean).join('\n');
};

const extractJson = (text: string): string | null => {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock?.[1]) {
    const inner = codeBlock[1].trim();
    if (inner.startsWith('{') && inner.endsWith('}')) return inner;
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return null;
};

const isValidKind = (k: string): k is DiataxisEntityKind =>
  ['file', 'note', 'skill', 'macro', 'diagram', 'task', 'mock', 'favorite'].includes(k);

const isValidCreateKind = (k: string): k is Extract<DiataxisEntityKind, 'note' | 'skill' | 'macro' | 'diagram' | 'task'> =>
  ['note', 'skill', 'macro', 'diagram', 'task'].includes(k);

const isValidType = (t: string): t is SuggestedItem['type'] =>
  ['tutorial', 'how-to', 'reference', 'explanation'].includes(t);

const normalizeSuggestion = (raw: unknown, fallbackPurpose: string, fallbackDepth: DiataxisDepth): SuggestedDocSet => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('IA não retornou um objeto JSON válido');
  }
  const r = raw as Record<string, unknown>;

  const title = typeof r.title === 'string' ? r.title : fallbackPurpose;
  const purpose = typeof r.purpose === 'string' ? r.purpose : fallbackPurpose;
  const audience = typeof r.audience === 'string' ? r.audience : undefined;
  const depth = ['quick', 'complete', 'deep'].includes(r.depth as string)
    ? r.depth as DiataxisDepth
    : fallbackDepth;

  const items: SuggestedItem[] = [];
  if (Array.isArray(r.items)) {
    for (const it of r.items) {
      if (!it || typeof it !== 'object') continue;
      const i = it as Record<string, unknown>;
      const type = isValidType(i.type as string) ? i.type as SuggestedItem['type'] : 'explanation';
      const action = i.action === 'create' ? 'create' : 'reference';
      const reason = typeof i.reason === 'string' ? i.reason : '';
      const userQuestion = typeof i.userQuestion === 'string' ? i.userQuestion : '';

      if (action === 'reference') {
        const ref = i.ref as Record<string, unknown> | undefined;
        const kind = ref && typeof ref.kind === 'string' && isValidKind(ref.kind)
          ? ref.kind
          : undefined;
        const id = ref && typeof ref.id === 'string' ? ref.id : undefined;
        if (kind && id) {
          items.push({ type, action, ref: { kind, id }, reason, userQuestion });
        }
      } else {
        const entityKind = typeof i.entityKind === 'string' && isValidCreateKind(i.entityKind)
          ? i.entityKind
          : undefined;
        const proposedContent = i.proposedContent;
        if (entityKind && proposedContent) {
          items.push({
            type,
            action,
            entityKind,
            proposedTitle: typeof i.proposedTitle === 'string' ? i.proposedTitle : undefined,
            proposedContent,
            reason,
            userQuestion,
          });
        }
      }
    }
  }

  return { title, purpose, audience, depth, items };
};

export const suggestDocSetWithAi = async (
  kv: Deno.Kv,
  context: WorkspaceContext,
  purpose: string,
  audience: string | undefined,
  depth: DiataxisDepth,
  allowCreation: boolean,
): Promise<SuggestedDocSet> => {
  const provider: Provider = await getProvider(kv);
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: buildUserPrompt(context, purpose, audience, depth, allowCreation) },
  ];

  let fullText = '';
  const signal = new AbortController().signal;
  for await (const chunk of streamChat(provider, messages, [], signal)) {
    if (chunk.error) throw new Error(chunk.error);
    if (typeof chunk.content === 'string') fullText += chunk.content;
  }

  const jsonText = extractJson(fullText);
  if (!jsonText) {
    throw new Error('IA não retornou JSON estruturado');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('JSON retornado pela IA é inválido');
  }

  return normalizeSuggestion(parsed, purpose, depth);
};
