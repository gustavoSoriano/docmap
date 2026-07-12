---
name: docmap
version: 3.0.0
description: >
  API REST local do docmap desktop — notas, diagramas Mermaid, skills, macros e kanban de tasks.
  Use quando o usuário mencionar notas, diagramas, skills, macros, tasks, kanban, ou compartilhar
  um ID/link do docmap. O app precisa estar rodando (deno task dev).
metadata:
  category: productivity
  tags: [notes, diagrams, mermaid, skills, macros, tasks, kanban, knowledge-base]
---

# docmap — AI Skill

Base URL: `http://127.0.0.1:3334`  
Formato: JSON em todas as respostas. App precisa estar rodando.

---

## Notas (knowledge base global)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/notes` | Lista (id, title, tags, category, preview) |
| GET | `/notes/:id` | Nota completa com `content` em markdown |
| POST | `/notes` | Cria `{ title, content, tags?, category? }` |
| PUT | `/notes/:id` | Edita (campos parciais) |
| DELETE | `/notes/:id` | Remove |
| GET | `/search?q=termo` | Busca full-text nas notas |

Categoria: texto livre (`general`, `prode`, `ai`, etc.).

---

## Diagramas Mermaid

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/diagrams` | Lista diagramas |
| GET | `/diagrams/:id` | Diagrama completo + `deepLink` |
| POST | `/diagrams` | Cria `{ title, source }` |
| PUT | `/diagrams/:id` | Edita |
| DELETE | `/diagrams/:id` | Remove |

**Deep link**: `GET /diagrams/:id` retorna `{ deepLink: "http://127.0.0.1:3333/#diagram/<id>" }`.  
Mande o `deepLink` ao usuário para abrir direto no app.

Tipos Mermaid: `flowchart`, `sequenceDiagram`, `classDiagram`, `stateDiagram-v2`, `erDiagram`, `gantt`, `pie`, `gitGraph`.

---

## Skills (read-only)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/skills` | Lista (id, name, title, description, tags) |
| GET | `/skills/:nameOrId` | Skill completa com `content` em markdown |

`name` é o slug legível (ex: `analyze-pr`). Acesse por nome ou UUID.

---

## Macros

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/macros` | Lista macros (id, name, title, description, interpreter) |
| GET | `/macros/:id` | Macro completa com `script` e `interpreter` |
| POST | `/macros` | Cria `{ name, title, description?, script }` |
| PUT | `/macros/:id` | Edita (campos parciais) |

O `interpreter` (`bash` ou `deno`) é detectado automaticamente pelo shebang.
Execução continua sendo manual pelo usuário dentro do app.

> **PATH limitado**: apps GUI não herdam o PATH do terminal. Ferramentas como `node`, `deno`, `cargo` etc.
> podem não ser encontradas. Use sempre caminhos absolutos ou source seu perfil no script.

---

## Fluxos comuns

### Criar diagrama e mandar deep link ao usuário
```
POST /diagrams { title, source }
→ retorna { id, deepLink }
→ mande o deepLink para o usuário abrir no app
```

### Encontrar e ler uma nota
```
GET /search?q=termo       → encontra por relevância
GET /notes/:id            → lê conteúdo completo
```

### Ler uma skill pelo nome
```
GET /skills/analyze-pr    → conteúdo completo da skill
```

### Criar nota a partir de contexto da conversa
```
POST /notes { title, content, tags, category }
```

---

## Tasks — Kanban global

Colunas fixas: `todo` (A Fazer) · `in-progress` (Em Andamento) · `done` (Concluído).  
Ordem dentro da coluna = prioridade (menor `order` = mais prioritário).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tasks` | Lista todas as tasks |
| GET | `/tasks/:id` | Task completa + `deepLink` |
| POST | `/tasks` | Cria `{ title, description?, status?, dueDate?, noteId? }` |
| PUT | `/tasks/:id` | Edita campos (parcial). `dueDate: null` e `noteId: null` removem o campo |
| DELETE | `/tasks/:id` | Remove |
| PUT | `/tasks/reorder` | Reordena coluna: `{ status, ids: string[] }` — redefine ordem e status de todas as tasks listadas |

**Campos:**
- `title` (string, obrigatório)
- `description` (markdown, opcional)
- `status`: `"todo"` | `"in-progress"` | `"done"`
- `order` (número, definido automaticamente na criação)
- `dueDate` (YYYY-MM-DD, opcional)
- `noteId` (UUID de uma nota vinculada, opcional)

**Deep link**: `GET /tasks/:id` retorna `{ deepLink: "http://127.0.0.1:3333/#task/<id>" }`.

### Fluxos comuns

#### Criar task e vinculá-la a uma nota
```
GET /notes              → encontra o ID da nota relevante
POST /tasks { title, description, status: "todo", noteId: "<id da nota>" }
```

#### Mover task para outra coluna
```
PUT /tasks/:id { status: "in-progress" }
```

#### Reordenar prioridades numa coluna (ex: colocar task X na frente)
```
GET /tasks                          → lê ordem atual
PUT /tasks/reorder { status: "todo", ids: ["<X>", "<A>", "<B>"] }
```

#### Listar tasks pendentes
```
GET /tasks   → filtre client-side por status !== "done"
```
