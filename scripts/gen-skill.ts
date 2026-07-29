// ════ Gerador da skill ════
// Gera o SKILL.md (raiz do projeto) e as skills globais dos agentes
// a partir de skillMarkdown() — a fonte
// canônica única do conteúdo (src/skill.ts). Rode após editar src/skill.ts:
//   deno task gen-skill

import { skillMarkdown } from '../src/skill.ts';

const VERSION = '7.0.0';

const frontMatter = `---
name: docmap
version: ${VERSION}
description: >
  API REST local do docmap desktop — notas com mapa mental anotável, diagramas
  Mermaid, skills, macros, kanban de tasks, favoritos, podcasts com áudio por IA
  (2+ vozes) e slides visuais sincronizados, canvas realtime para IA desenhar
  HTML ao vivo, mocks HTTP e workflows para orquestrar agentes externos de
  diferentes ferramentas, providers e modelos.
  Use quando o usuário mencionar notas, diagramas, skills, macros, tasks,
  kanban, agentes, orquestração, workflows, favoritos, podcasts, slides, mocks,
  canvas, canva, ou compartilhar um ID/link do docmap. O app precisa estar rodando.
metadata:
  category: productivity
  tags: [notes, diagrams, skills, tasks, agents, orchestration, workflows, podcasts, mocks, canvas, knowledge-base]
---

`;

const doc = frontMatter + skillMarkdown() + '\n';

// 1) SKILL.md na raiz do projeto.
await Deno.writeTextFile(new URL('../SKILL.md', import.meta.url), doc);
console.log('✓ SKILL.md (raiz) gerado');

// 2) Skills globais das ferramentas conhecidas (se HOME existir).
const home = Deno.env.get('HOME');
if (home) {
  const dirs = [
    `${home}/.claude/skills/docmap`,
    `${home}/.codex/skills/docmap`,
    `${home}/.config/opencode/skills/docmap`,
  ];
  for (const dir of dirs) {
    await Deno.mkdir(dir, { recursive: true });
    await Deno.writeTextFile(`${dir}/SKILL.md`, doc);
    console.log(`✓ skill global gerada em ${dir}/SKILL.md`);
  }
} else {
  console.log('• HOME indefinido — skill global pulada');
}

console.log(`✓ skill v${VERSION} propagada`);
