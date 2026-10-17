// Protocolo v7 (reels) — a IA entrega um caderno em telas: 1 ideia por reel.
// Cada reel tem um rótulo, uma conclusão, uma prova (código real) e, SÓ quando
// ajudar, um visual. Nenhuma ferramenta é obrigatória.
import type { StructurePack, TourDepth } from './types.ts';

export const DEPTH_LABEL: Record<TourDepth, string> = {
  resumo: 'resumo rápido',
  repasse: 'repasse sênior',
  deep: 'mergulho profundo',
};

const depthRules = (depth: TourDepth): string => {
  if (depth === 'resumo') {
    return [
      `Profundidade RESUMO: 3 a 6 reels.`,
      `Cada reel prova a ideia com um snippet curto (20 a 800 chars).`,
    ].join(' ');
  }
  if (depth === 'deep') {
    return [
      `Profundidade DEEP: 10 a 18 reels.`,
      `Snippet real de 20 a 2500 chars, pode marcar até 8 linhas-chave.`,
    ].join(' ');
  }
  return [
    `Profundidade REPASSE: 6 a 12 reels.`,
    `Snippet real de 20 a 1500 chars, marque de 1 a 3 linhas-chave.`,
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

const ANATOMY = [
  `ANATOMIA DE UM REEL (uma ideia por tela, nada mais):`,
  `- label: rótulo curto (2 a 24 chars) que situa o assunto. Ex.: "a corrida", "o pulso".`,
  `- title: a CONCLUSÃO, não o suspense. 8 a 100 chars. Entrega o que + onde.`,
  `  Bom: "O service barra título vazio antes de salvar". Ruim: "A porta de entrada".`,
  `- code: a prova. Trecho REAL do arquivo, com "file" no formato "src/x.ts:10"`,
  `  (path:linha inicial) e "mark" = lista de linhas ABSOLUTAS a destacar`,
  `  (ex.: [12, 13]). Todo número em mark precisa existir no trecho.`,
  `- visual: OPCIONAL. No máximo 1 por reel, e só quando a ideia é melhor`,
  `  VISTA do que lida (fluxo, hierarquia, relação). Se o código já explica,`,
  `  não use visual.`,
  `- rule: OPCIONAL. A regra/porquê em 1 frase (20 a 300 chars) + "file" opcional.`,
  `- sub: legenda curta (até 160 chars) para reforçar a ideia.`,
  `- narration: texto falável obrigatório (40 a 800 chars).`,
].join('\n');

const VISUALS = [
  `TOOLS VISUAIS (paleta permitida — use APENAS as marcadas, e só se somarem):`,
  `1. mermaid — APENAS este subconjunto seguro (o render quebra com o resto), um elemento por linha:`,
  `flowchart LR; A[Service valida]-->B[Store salva]; B-->C[KV persiste]; class A service; class B data; class C data;`,
  `Regras duras: ids simples ASCII (A, B, svc1); labels curtos SEM parênteses, aspas, dois-pontos, pipe, hashtag, <, crase ou emoji (> SÓ em -->); sem "click", "style", "subgraph"; class SÓ p/ id já definido, com camada api/service/data/ui/test/util.`,
  `2. mindmap — markdown com # e - para hierarquias (módulos, camadas, conceitos).`,
  `3. html — trecho HTML livre (sem script, sem iframe): tabelas, antes/depois, timelines, callouts. É sanitizado.`,
  `4. bubble — mapa radial de bolhas (centro + 2 a 8 hubs + satélites) em JSON.`,
  `JSON do bubble: {"center":{"label":"TEMA CENTRAL","detail":"frase de 1 a 280 chars"},"nodes":[{"id":"hub1","label":"NOME","detail":"o que é e por que importa","parent":null,"file":"src/x.ts:10","reel":"r2"},{"id":"sat1","label":"DETALHE","detail":"...","parent":"hub1"}]}.`,
  `Regras do bubble: 3 a 24 nós, label até 40 chars, detail até 280, parent null = hub ligado ao centro, file/reel opcionais mas devem existir.`,
].join('\n');

const LANGUAGE = [
  `LINGUAGEM — explicação técnica direta, sem analogias nem metáforas:`,
  `- Comece pelo que é e onde mora (arquivo:linha), sem rodeios.`,
  `- Exemplo concreto com valores reais em seguida (chega X, sai Y, nesta linha).`,
  `- Feche com o que quebra se remover (o porquê da existência).`,
  `- Nenhum termo sem explicação de 1 linha antes.`,
].join('\n');

const NARRATION = [
  `NARRAÇÃO (obrigatória, um áudio por reel) — texto de FALA, não de leitura:`,
  `- 40 a 800 chars, frases curtas, português falado.`,
  `- Conta o essencial do reel como se estivesse ao lado: o que é, onde mora, exemplo com valor real.`,
  `- Sem markdown, sem código, sem "arquivo:linha", sem tags. Só texto puro que o TTS vai falar.`,
].join('\n');

export const buildCodetourPrompt = (
  projectRoot: string,
  query: string,
  depth: TourDepth,
  pack: StructurePack | null,
): string => {
  const topic = query.trim() || 'visão geral';
  return [
    `Você é um sênior montando um caderno visual (reels) de "${topic}".`,
    `Projeto em: ${projectRoot.trim()}`,
    ``,
    `A ESTRUTURA ABAIXO FOI EXTRAÍDA POR SCAN LOCAL — É A VERDADE.`,
    `Use SÓ arquivos e símbolos que aparecem nela. Não invente paths.`,
    `Snippets devem ser trechos REAIS desses arquivos.`,
    `Reels seguem a ordem de dependência sugerida quando fizer sentido.`,
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
    ``,
    ANATOMY,
    ``,
    VISUALS,
    ``,
    LANGUAGE,
    ``,
    NARRATION,
    ``,
    `Responda SOMENTE com JSON válido, sem markdown extra:`,
    `{`,
    `  "topic": "${topic}",`,
    `  "goal": "o que isso faz e por que importa",`,
    `  "reels": [{ "id": "r1", "label": "a corrida",`,
    `    "title": "O service barra título vazio antes de salvar",`,
    `    "code": {"file": "src/x.ts:10"`,
    `      "code": "if (!input.title.trim()) {\\n  return badRequest('título vazio');\\n}",`,
    `      "mark": [10, 11]},`,
    `    "visual": null,`,
    `    "rule": {"file": "src/x.ts", "text": "Título vazio nunca chega ao store."},`,
    `    "sub": "Sem essa barreira, dado sujo pararia no banco.",`,
    `    "narration": "Olha esse service. Ele recebe o título, barra vazio na linha dez e só aí salva. Sem ele, dado sujo pararia no banco."`,
    `  },`,
    `  { "id": "r2", "label": "o fluxo",`,
    `    "title": "A ordem: validar, salvar, persistir",`,
    `    "code": null,`,
    `    "visual": {"kind": "mermaid", "title": "Fluxo", "content": "flowchart LR; A[Service valida]-->B[Store salva]; B-->C[KV persiste]; class A service; class B data; class C data;"},`,
    `    "rule": null,`,
    `    "sub": "Cada camada só passa adiante o que validou.",`,
    `    "narration": "O caminho é sempre o mesmo: o service valida, o store salva e o KV persiste. Cada etapa só passa adiante o que já conferiu."`,
    `  }]`,
    `}`,
  ].join('\n');
};

// Agent-prompt autocontido: as 3 chamadas carregam o id do caderno, então
// N cadernos pendentes coexistem sem conflito de sessão.
const queryOf = (notebookId?: string): string =>
  notebookId ? `?id=${encodeURIComponent(notebookId)}` : '';

export const buildAgentPrompt = (
  projectRoot: string,
  query: string,
  depth: TourDepth,
  notebookId?: string,
): string => {
  const topic = query.trim() || 'visão geral';
  const q = queryOf(notebookId);
  const idStep = notebookId
    ? `8. Devolva SOZINHO via POST http://127.0.0.1:3333/codetour/import com {"id":"${notebookId}","reel": {...}} — use ESSE id em todas as chamadas.`
    : `8. Devolva SOZINHO via POST http://127.0.0.1:3333/codetour/import com {"reel": {...}}.`;
  return [
    `Monte um caderno visual (reels) de ${
      DEPTH_LABEL[depth]
    } sobre "${topic}" do projeto em ${projectRoot.trim()}.`,
    ``,
    `1. Busque o protocolo: GET http://127.0.0.1:3333/codetour/prompt${q}`,
    `2. Busque a estrutura escaneada: GET http://127.0.0.1:3333/codetour/structure${q}`,
    `3. Use SÓ arquivos/símbolos do scan. Snippets REAIS, ordem por dependência.`,
    `4. Uma ideia por reel. Título entrega a conclusão. Snippet com linhas marcadas.`,
    `5. Visual é OPCIONAL: use mermaid/mindmap/html/bubble só quando a ideia for melhor vista do que lida.`,
    `6. Explique técnico e direto: o que é + exemplo com valores + o que quebra. Sem analogias.`,
    `7. narration obrigatória por reel (40 a 800 chars, texto falável, sem código).`,
    idStep,
    `9. Não peça pro usuário colar nada — a tela atualiza sozinha.`,
    ``,
    `Superficial ou com paths inventados será rejeitado.`,
  ].join('\n');
};
