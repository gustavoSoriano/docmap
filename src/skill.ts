import { API_PORT } from './api/server.ts';

export const skillMarkdown = (): string => `# docmap — API local (para IA)

Base URL: http://127.0.0.1:${API_PORT}
Formato: JSON. Todos os endpoints são REST.

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

## Fluxo sugerido

### Notas
1. \`GET /notes\` ou \`GET /search?q=\` — encontre o que existe
2. \`GET /notes/:id\` — leia completo
3. \`POST\`/\`PUT\` — registre o que aprendeu

### Diagramas
1. \`GET /diagrams\` — veja o que existe
2. \`POST /diagrams\` — crie com Mermaid
3. Retorne o \`deepLink\` para o usuário abrir no app
`;
