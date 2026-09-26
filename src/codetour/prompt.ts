// Protocolo v5 — a IA recebe as tools e usa TODAS: mermaid, mindmap,
// html. Explicação em linguagem simples: gancho + exemplo + o que quebra.
import type { StructurePack, TourDepth } from './types.ts';

export const DEPTH_LABEL: Record<TourDepth, string> = {
  resumo: 'resumo rápido',
  repasse: 'repasse sênior',
  deep: 'mergulho profundo',
};

const depthRules = (depth: TourDepth): string => {
  if (depth === 'resumo') {
    return [
      `Profundidade RESUMO: 1 a 4 slides, bullets curtos,`,
      `explain de 1 a 2 frases (40 a 400 chars), snippet opcional,`,
      `flows com detail de 20 a 200 chars (1 a 6 passos).`,
    ].join(' ');
  }
  if (depth === 'deep') {
    return [
      `Profundidade DEEP: até 10 slides, explain 200 a 1500 chars,`,
      `snippet real 20 a 2500 chars, flows até 16 passos com detail até 400,`,
      `pitfalls/nextSteps até 8.`,
    ].join(' ');
  }
  return [
    `Profundidade REPASSE: máx 6 slides, explain 200 a 900 chars,`,
    `snippet real 20 a 1500 chars, flows até 12 com detail 20 a 400.`,
  ].join(' ');
};

const topPaths = (pack: StructurePack | null, max: number): string => {
  if (!pack || pack.files.length === 0) return '(scan vazio — varra você)';
  return pack.files
    .slice(0, max)
    .map((f) =>
      `- ${f.path} [${f.layer}] ${f.symbols.map((s) => s.name).join(', ')}`
    )
    .join('\n');
};

const TOOLS = [
  `FERRAMENTAS — use TODAS ao menos 1x no tour, no slide onde fizer sentido:`,
  `1. mermaid: código flowchart do momento (comece com "flowchart LR", ligue com -->, use class api/service/data/ui). Para fluxos e decisões.`,
  `2. mindmap: markdown com # e - para hierarquias (módulos, camadas, conceitos). Para o mapa do território.`,
  `3. html: trecho HTML livre (sem script, sem iframe) para o que as outras não expressam: tabelas, antes/depois, timelines, callouts. É sanitizado.`,
  `Cada slide pode ter até 3 visuals. Tour sem alguma tool é rejeitado.`,
].join('\n');

const LANGUAGE = [
  `LINGUAGEM — explique como para alguém sem contexto, não como para um par:`,
  `- Gancho de 1 frase primeiro (modelo mental: "pense nisto como...").`,
  `- Exemplo concreto com valores reais em seguida (chega X, sai Y, nesta linha).`,
  `- Feche com o que quebra se remover (o porquê da existência).`,
  `- 1 ideia por slide: 1 afirmação + 1 prova (snippet ou linha).`,
  `- Nenhum termo sem explicação de 1 linha antes. Sem substantivo abstrato solto.`,
  `- check: pergunta que o leitor deve conseguir responder se entendeu (20 a 280 chars).`,
].join('\n');

export const buildCodetourPrompt = (
  projectRoot: string,
  query: string,
  depth: TourDepth,
  pack: StructurePack | null,
): string => {
  const topic = query.trim() || 'visão geral';
  return [
    `Você é um sênior fazendo ${DEPTH_LABEL[depth]} de "${topic}".`,
    `Projeto em: ${projectRoot.trim()}`,
    ``,
    `A ESTRUTURA ABAIXO FOI EXTRAÍDA POR SCAN LOCAL — É A VERDADE.`,
    `Use SÓ arquivos e símbolos que aparecem nela. Não invente paths.`,
    `Snippets devem ser trechos REAIS desses arquivos.`,
    `Slides/flows seguem a ordem de dependência sugerida quando fizer sentido.`,
    ``,
    `Arquivos relevantes (path [camada] símbolos):`,
    topPaths(pack, 60),
    ``,
    `Ordem de dependência sugerida: ${
      (pack?.order ?? []).slice(0, 30).join(' → ') || '(ver pack)'
    }`,
    `Pack completo em: GET http://127.0.0.1:3333/codetour/structure`,
    ``,
    depthRules(depth),
    `Bullets: TL;DR, máx 3, até 120 chars cada.`,
    ``,
    TOOLS,
    ``,
    LANGUAGE,
    ``,
    `Responda SOMENTE com JSON válido, sem markdown extra:`,
    `{`,
    `  "topic": "${topic}",`,
    `  "goal": "o que isso faz e por que importa",`,
    `  "slides": [{ "id": "s1", "title": "Visão geral",`,
    `    "bullets": ["ponto 1"],`,
    `    "explain": "gancho + exemplo + o que quebra…",`,
    `    "check": "se entendeu, você responde: ...?",`,
    `    "snippet": {"file": "src/x.ts:10", "code": "trecho real…"},`,
    `    "visuals": [`,
    `      {"kind": "mermaid", "title": "Fluxo", "content": "flowchart LR; ..."},`,
    `      {"kind": "mindmap", "title": "Mapa", "content": "# tópico\\n- item"},`,
    `      {"kind": "html", "title": "Quadro", "content": "<table>..."}`,
    `    ],`,
    `    "files": ["src/x.ts:10"] }],`,
    `  "flows": [{ "label": "a → b → c",`,
    `    "file": "src/x.ts:20", "detail": "o que acontece e por quê" }],`,
    `  "contracts": [{ "name": "createX(input)", "input": "{...}",`,
    `    "output": "{...}", "notes": "efeito colateral?" }],`,
    `  "keyFiles": ["src/x.ts:1"],`,
    `  "pitfalls": ["onde quebra e como evitar"],`,
    `  "nextSteps": ["ler src/x.ts primeiro"]`,
    `}`,
  ].join('\n');
};

export const buildAgentPrompt = (
  projectRoot: string,
  query: string,
  depth: TourDepth,
): string => {
  const topic = query.trim() || 'visão geral';
  return [
    `Faça ${
      DEPTH_LABEL[depth]
    } de "${topic}" do projeto em ${projectRoot.trim()}.`,
    ``,
    `1. Busque o protocolo: GET http://127.0.0.1:3333/codetour/prompt`,
    `2. Busque a estrutura escaneada: GET http://127.0.0.1:3333/codetour/structure`,
    `3. Use SÓ arquivos/símbolos do scan. Snippets REAIS, ordem por dependência.`,
    `4. Use TODAS as tools ao menos 1x: mermaid, mindmap e html por slide.`,
    `5. Explique simples: gancho + exemplo com valores + o que quebra.`,
    `6. Devolva SOZINHO via POST http://127.0.0.1:3333/codetour/import com {"tour": {...}}.`,
    `7. Não peça pro usuário colar nada — a tela atualiza sozinha.`,
    ``,
    `Superficial, com paths inventados ou sem alguma tool será rejeitado.`,
  ].join('\n');
};
