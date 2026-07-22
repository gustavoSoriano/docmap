// ════ Gerador da skill ════
// Gera o SKILL.md (raiz do projeto) e a skill global do Claude Code
// (~/.claude/skills/docmap/SKILL.md) a partir de skillMarkdown() — a fonte
// canônica única do conteúdo (src/skill.ts). Rode após editar src/skill.ts:
//   deno task gen-skill

import { skillMarkdown } from '../src/skill.ts';

const VERSION = '6.1.0';

const frontMatter = `---
name: docmap
version: ${VERSION}
description: >
  API REST local do docmap desktop — notas com mapa mental anotável, diagramas
  Mermaid, skills, macros, kanban de tasks, favoritos, podcasts com áudio por IA
  (2+ vozes) e slides visuais sincronizados, e mocks HTTP. Toda entidade aceita
  \`tags\` (tema/assunto — eixo do grafo de conhecimento). Use quando o usuário
  mencionar notas, diagramas, skills, macros, tasks, kanban, favoritos,
  podcasts, slides, mocks, ou compartilhar um ID/link do docmap. O app precisa
  estar rodando (deno task dev).
metadata:
  category: productivity
  tags: [notes, diagrams, mermaid, skills, macros, tasks, kanban, favorites, podcasts, slides, mocks, knowledge-base]
---

`;

const doc = frontMatter + skillMarkdown() + '\n';

// 1) SKILL.md na raiz do projeto.
await Deno.writeTextFile(new URL('../SKILL.md', import.meta.url), doc);
console.log('✓ SKILL.md (raiz) gerado');

// 2) Skill global do Claude Code (se HOME existir).
const home = Deno.env.get('HOME');
if (home) {
  const dir = `${home}/.claude/skills/docmap`;
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(`${dir}/SKILL.md`, doc);
  console.log(`✓ skill global gerada em ${dir}/SKILL.md`);
} else {
  console.log('• HOME indefinido — skill global pulada');
}

console.log(`✓ skill v${VERSION} propagada`);
