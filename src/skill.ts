import { API_PORT } from './api/server.ts';

export const skillMarkdown = (): string =>
  `# docmap — API local (para IA)

Base URL: http://127.0.0.1:${API_PORT}
Formato: JSON. Todos os endpoints são REST.

---

## Workspace (grafos e arquivos .md)

Estes endpoints leem a pasta de trabalho que o usuário abriu no docmap.
Retornam erro se nenhum workspace estiver selecionado.

- \`GET /graph\` — retorna o grafo de links entre arquivos \`.md\`
  - \`nodes\`: \`{ id, label, group }\` — o \`id\` é o caminho relativo do arquivo
  - \`links\`: \`{ source, target }\` — conexões baseadas em links \`[[...]]\` e \`[texto](arquivo.md)\`
- \`GET /graph/relations?file=<caminho/relativo.md>\` — retorna as relações de um arquivo
  - Exemplo: \`GET /graph/relations?file=README.md\`
  - Resposta: \`{ file, outgoing: [...], incoming: [...] }\`
  - \`outgoing\`: arquivos para os quais este arquivo aponta
  - \`incoming\`: arquivos que apontam para este arquivo
- \`GET /content?file=<caminho/relativo.md>\` — lê o conteúdo bruto de um arquivo
  - Exemplo: \`GET /content?file=README.md\`
  - Resposta: \`{ path, raw }\` onde \`raw\` é o markdown completo
- \`GET /docs/search?q=termo\` — busca ocorrências nos arquivos \`.md\` do workspace
  - Resposta: array de \`{ file, line, heading, snippet }\`

Para explorar o workspace, use este fluxo:
1. \`GET /graph\` — entenda a estrutura e os arquivos disponíveis
2. \`GET /graph/relations?file=<caminho>\` — veja quem se relaciona com um arquivo
3. \`GET /docs/search?q=termo\` — localize onde um assunto é mencionado
4. \`GET /content?file=<caminho>\` — leia o arquivo completo quando precisar de contexto

Se o usuário pedir para alterar um arquivo, você já tem o caminho relativo no \`id\` do grafo, no \`file\` das relações ou no campo \`file\` da busca. A edição em si deve ser feita pelo canal de escrita que o usuário indicar (o docmap não expõe escrita de arquivos por esta API).

---

## Notas

- \`GET /notes\` — lista notas (id, title, tags, category, preview, datas)
- \`GET /notes/:id\` — nota completa com \`content\` em markdown
- \`POST /notes\` — cria. Body: \`{ title, content, tags?, category? }\`
- \`PUT /notes/:id\` — edita (só os campos que mudam)
- \`DELETE /notes/:id\` — remove
- \`GET /search?q=termo\` — busca full-text nas notas

Categoria: texto livre (ex.: general, prode, ai). Default: "general".

---

## Diagramas Mermaid

- \`GET /diagrams\` — lista diagramas (id, title, preview, datas)
- \`GET /diagrams/:id\` — diagrama completo com \`source\` (Mermaid) e \`deepLink\`
- \`POST /diagrams\` — cria. Body: \`{ title, source }\`
- \`PUT /diagrams/:id\` — edita
- \`DELETE /diagrams/:id\` — remove

**Deep link**: cada diagrama tem \`deepLink: "http://127.0.0.1:3333/#diagram/<id>"\`
— copie e mande para o usuário abrir direto no app.

Criar diagrama (sintaxe Mermaid no campo \`source\`):
\`\`\`
curl -X POST http://127.0.0.1:${API_PORT}/diagrams \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"Fluxo","source":"flowchart LR\\n  A --> B --> C"}'
\`\`\`

Tipos suportados: flowchart, sequenceDiagram, classDiagram,
stateDiagram-v2, erDiagram, gantt, pie, gitGraph.

---

## Skills (read-only para IA)

- \`GET /skills\` — lista skills (id, name, title, description, tags)
- \`GET /skills/:nameOrId\` — skill completa com \`content\` em markdown

O \`name\` é um slug legível (ex.: \`analyze-pr\`, \`deploy-checklist\`).
Use o nome que o usuário te passar: \`GET /skills/analyze-pr\`

---

## Tasks — Kanban global

Colunas fixas: \`todo\` (A Fazer) · \`in-progress\` (Em Andamento) · \`done\` (Concluído).
Ordem dentro da coluna = prioridade (menor \`order\` = mais prioritário).

- \`GET /tasks\` — lista todas as tasks
- \`GET /tasks/:id\` — task completa + \`deepLink\`
- \`POST /tasks\` — cria. Body: \`{ title, description?, status?, dueDate?, noteId? }\`
- \`PUT /tasks/:id\` — edita campos (parcial). \`dueDate: null\` e \`noteId: null\` removem o campo
- \`DELETE /tasks/:id\` — remove
- \`PUT /tasks/reorder\` — reordena coluna: \`{ status, ids: string[] }\`

Campos:
- \`title\` (string, obrigatório)
- \`description\` (markdown, opcional)
- \`status\`: \`"todo"\` | \`"in-progress"\` | \`"done"\`
- \`dueDate\` (YYYY-MM-DD, opcional)
- \`noteId\` (UUID de uma nota vinculada, opcional)

Deep link: \`GET /tasks/:id\` retorna \`{ deepLink: "http://127.0.0.1:3333/#task/<id>" }\`.

Fluxos comuns:
- Criar task vinculada a uma nota:
  1. \`GET /notes\` → encontra o ID da nota
  2. \`POST /tasks { title, description, status: "todo", noteId: "<id>" }\`
- Mover task para outra coluna: \`PUT /tasks/:id { status: "in-progress" }\`
- Reordenar prioridades: \`GET /tasks\` → \`PUT /tasks/reorder { status: "todo", ids: ["<X>", "<A>", "<B>"] }\`
- Listar pendentes: \`GET /tasks\` → filtre \`status !== "done"\`

---

## Fluxo sugerido

### Notas
1. \`GET /notes\` ou \`GET /search?q=\` — encontre o que existe
2. \`GET /notes/:id\` — leia completo
3. \`POST\`/\`PUT\` — registre o que aprendeu

### Diagramas
1. \`GET /diagrams\` — veja o que existe
2. \`POST /diagrams\` — crie com Mermaid
3. Retorne o \`deepLink\` para o usuário abrir no app

### Tasks
1. \`GET /tasks\` — veja o estado atual do Kanban
2. \`POST /tasks\` — crie novas tasks, vincule a notas quando relevante
3. \`PUT /tasks/:id\` — mova entre colunas ou edite dados
`;
