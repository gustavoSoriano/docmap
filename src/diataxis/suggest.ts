import type { DiataxisDepth, DiataxisEntityKind, SuggestedDocSet, SuggestedItem } from './types.ts';
import type { WorkspaceContext, AnalyzedFile, AnalyzedEntity } from './analyzer.ts';

const escHtml = (str: string): string =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const TUTORIAL_HINTS = [
  'readme', 'getting-started', 'tutorial', 'quickstart', 'start', 'first-steps',
  'onboarding', 'intro', 'introduction', 'hello-world', 'learn',
];

const HOWTO_HINTS = [
  'howto', 'how-to', 'deploy', 'install', 'setup', 'configure', 'run', 'build',
  'checklist', 'guide', 'cookbook', 'recipe', 'migrate', 'upgrade', 'rollback',
  'troubleshoot', 'debug', 'fix',
];

const REFERENCE_HINTS = [
  'api', 'reference', 'config', 'env', 'variables', 'schema', 'commands',
  'endpoints', 'parameters', 'options', 'flags', 'manifest', 'spec', 'specs',
  'list', 'glossary', 'index', 'cheatsheet',
];

const EXPLANATION_HINTS = [
  'architecture', 'design', 'why', 'decisions', 'adr', 'philosophy', 'overview',
  'concepts', 'background', 'rationale', 'explanation', 'deep-dive', 'theory',
  'principles', 'patterns',
];

const classifyText = (text: string): SuggestedItem['type'] => {
  const t = text.toLowerCase();
  if (TUTORIAL_HINTS.some((h) => t.includes(h))) return 'tutorial';
  if (HOWTO_HINTS.some((h) => t.includes(h))) return 'how-to';
  if (REFERENCE_HINTS.some((h) => t.includes(h))) return 'reference';
  if (EXPLANATION_HINTS.some((h) => t.includes(h))) return 'explanation';
  return 'explanation'; // default seguro para material desconhecido
};

const reasonFor = (type: SuggestedItem['type'], title: string): string => {
  switch (type) {
    case 'tutorial':
      return `\`${title}\` parece ser material de primeira experiência prática.`;
    case 'how-to':
      return `\`${title}\` parece guiar a resolução de uma tarefa específica.`;
    case 'reference':
      return `\`${title}\` parece ser material de consulta factual.`;
    case 'explanation':
      return `\`${title}\` parece aprofundar o entendimento do porquê das coisas.`;
  }
};

const questionFor = (type: SuggestedItem['type'], title: string): string => {
  switch (type) {
    case 'tutorial':
      return `Como faço minha primeira experiência prática com ${title}?`;
    case 'how-to':
      return `Como resolvo uma tarefa real usando ${title}?`;
    case 'reference':
      return `Quais são os fatos/valores/comandos de ${title}?`;
    case 'explanation':
      return `Por que ${title} é assim e qual o contexto por trás?`;
  }
};

const suggestFromFile = (file: AnalyzedFile): SuggestedItem => {
  const type = classifyText(`${file.id} ${file.title}`);
  return {
    type,
    action: 'reference',
    ref: { kind: 'file', id: file.id },
    reason: reasonFor(type, file.title),
    userQuestion: questionFor(type, file.title),
  };
};

const suggestFromEntity = (entity: AnalyzedEntity): SuggestedItem => {
  const type = classifyText(`${entity.title} ${entity.description ?? ''}`);
  return {
    type,
    action: 'reference',
    ref: { kind: entity.kind, id: entity.id },
    reason: reasonFor(type, entity.title),
    userQuestion: questionFor(type, entity.title),
  };
};

const inferTitle = (purpose: string): string => {
  const cleaned = purpose.trim();
  if (!cleaned) return 'Visão Diátaxis';
  const first = cleaned.split(/[.!?]/)[0] ?? cleaned;
  return first.length > 60 ? `${first.slice(0, 57)}...` : first;
};

const inferDepth = (depth?: DiataxisDepth): DiataxisDepth =>
  depth ?? 'complete';

export const suggestDocSet = (
  context: WorkspaceContext,
  purpose: string,
  audience?: string,
  depth?: DiataxisDepth,
  allowCreation = true,
): SuggestedDocSet => {
  const items: SuggestedItem[] = [
    ...context.files.map(suggestFromFile),
    ...context.notes.map(suggestFromEntity),
    ...context.skills.map(suggestFromEntity),
    ...context.macros.map(suggestFromEntity),
    ...context.diagrams.map(suggestFromEntity),
    ...context.tasks.map(suggestFromEntity),
    ...context.mocks.map((m) => ({
      type: 'reference' as const,
      action: 'reference' as const,
      ref: { kind: 'mock' as DiataxisEntityKind, id: m.id },
      reason: `\`${m.title}\` é um contrato de API para consulta.`,
      userQuestion: `Qual o contrato/comportamento de ${m.title}?`,
    })),
    ...context.favorites.map((f) => ({
      type: 'reference' as const,
      action: 'reference' as const,
      ref: { kind: 'favorite' as DiataxisEntityKind, id: f.id },
      reason: `\`${f.title}\` é um recurso externo de referência.`,
      userQuestion: `Onde encontro ${f.title}?`,
    })),
  ];

  // Garante que haja pelo menos um item de cada quadrante quando allowCreation é true.
  const hasType = (type: SuggestedItem['type']) =>
    items.some((i) => i.type === type);

  if (allowCreation) {
    if (!hasType('tutorial')) {
      items.push({
        type: 'tutorial',
        action: 'create',
        entityKind: 'note',
        proposedTitle: 'Primeiros passos',
        proposedContent: {
          title: 'Primeiros passos',
          content: `<h1>Primeiros passos</h1>\n\n<p>Este guia foi sugerido automaticamente para ajudar no propósito: <strong>${escHtml(purpose)}</strong>.</p>\n\n<h2>Objetivo</h2>\n<p>Levar alguém do zero até a primeira experiência prática.</p>\n\n<h2>Pré-requisitos</h2>\n<ul>\n  <li>Liste aqui o que é necessário saber antes.</li>\n</ul>\n\n<h2>Passo a passo</h2>\n<ol>\n  <li>Primeiro passo</li>\n  <li>Segundo passo</li>\n  <li>Terceiro passo</li>\n</ol>\n`,
          category: 'diataxis',
        },
        reason: 'Nenhum material de tutorial foi encontrado; criar um guia inicial.',
        userQuestion: 'Por onde começo pela primeira vez?',
      });
    }

    if (!hasType('how-to')) {
      items.push({
        type: 'how-to',
        action: 'create',
        entityKind: 'skill',
        proposedTitle: 'how-to-guide',
        proposedContent: {
          name: 'how-to-guide',
          title: 'Como fazer [tarefa comum]',
          description: `Guia prático para resolver uma tarefa comum no contexto: ${purpose}`,
          content: `# Como fazer [tarefa comum]\n\n## Contexto\n\n${purpose}\n\n## Passos\n\n1. Identifique o problema\n2. Execute a ação corretiva\n3. Valide o resultado\n`,
        },
        reason: 'Nenhum material de how-to foi encontrado; criar um guia prático.',
        userQuestion: 'Como resolvo uma tarefa específica?',
      });
    }

    if (!hasType('reference')) {
      items.push({
        type: 'reference',
        action: 'create',
        entityKind: 'note',
        proposedTitle: 'Referência rápida',
        proposedContent: {
          title: 'Referência rápida',
          content: `# Referência rápida\n\nLista de valores, comandos, env vars e links úteis para: ${purpose}.\n\n## Comandos\n\n| Comando | Descrição |\n|---------|-----------|\n\n## Variáveis de ambiente\n\n| Variável | Valor padrão | Descrição |\n|----------|--------------|-----------|\n`,
          category: 'diataxis',
        },
        reason: 'Nenhum material de referência foi encontrado; criar uma nota de consulta.',
        userQuestion: 'Quais são os fatos e valores que preciso consultar?',
      });
    }

    if (!hasType('explanation')) {
      items.push({
        type: 'explanation',
        action: 'create',
        entityKind: 'diagram',
        proposedTitle: 'Visão geral do sistema',
        proposedContent: {
          title: 'Visão geral do sistema',
          source: `flowchart TD\n    A[Início] --> B{Decisão}\n    B -->|Sim| C[Resultado 1]\n    B -->|Não| D[Resultado 2]\n`,
        },
        reason: 'Nenhum material de explicação foi encontrado; criar um diagrama de visão geral.',
        userQuestion: 'Por que o sistema é organizado assim?',
      });
    }
  }

  return {
    title: inferTitle(purpose),
    purpose,
    audience,
    depth: inferDepth(depth),
    items,
  };
};
