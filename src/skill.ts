import { API_PORT } from './api/server.ts';
import { MOCK_PORT } from './mocks/server.ts';

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

## Macros

- \`GET /macros\` — lista macros (id, name, title, description, interpreter, datas)
- \`GET /macros/:id\` — macro completa com \`script\` e \`interpreter\`
- \`POST /macros\` — cria. Body: \`{ name, title, description?, script }\`
- \`PUT /macros/:id\` — edita (só os campos que mudam)

O \`interpreter\` é detectado automaticamente pelo shebang: \`bash\` ou \`deno\`.
Use para salvar scripts auxiliares que o usuário executa manualmente no app.

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

## Podcasts — áudio gerado por IA (2+ vozes)

Gera podcasts em áudio a partir de conteúdo de estudo. Sempre com **2+ personas**
com vozes distintas. A geração é **assíncrona**: o POST retorna 202 imediatamente
e o áudio fica pronto segundos/minutos depois (status \`generating\` → \`ready\`).

Pré-requisitos na máquina: \`edge-tts\` (pip) e \`ffmpeg\` (brew install ffmpeg).

### Endpoints

- \`GET /podcasts/health\` — verifica dependências externas (edge-tts, ffmpeg, ffprobe). Retorna \`{ ready, edgeTts, ffmpeg, ffprobe, instructions[] }\`. Se \`ready=false\`, inclui os comandos de instalação
- \`GET /podcasts?q=&folder=\` — lista previews (sem \`script\`); \`q\` busca no título
- \`GET /podcasts/:id\` — podcast completo (com \`script\`) + \`deepLink\`
- \`GET /podcasts/:id/audio\` — stream MP3 com suporte a Range (pra player)
- \`GET /podcasts/voices\` — vozes pt-BR disponíveis (id + gender + style)
- \`GET /podcasts/folders\` — pastas derivadas dos podcasts existentes
- \`POST /podcasts\` — gera. Body:
  - \`title\` (obrigatório)
  - \`content\` **ou** \`script\` (obrigatório um dos dois):
    - \`content\`: texto bruto → o docmap gera o roteiro via provider configurado
    - \`script\`: roteiro pronto com tags \`<Person1>…</Person1>\` → só sintetiza o áudio
  - \`voices\` (opcional): array de \`{ name, voice }\` — mínimo 2, vozes distintas.
    Omitido → o docmap sorteia 2 vozes pt-BR. Use \`GET /podcasts/voices\` pra escolher.
  - \`folder\` (opcional, default "geral")
  - Retorna **202** com \`{ id, deepLink, status: "generating" }\`
- \`PUT /podcasts/:id\` — edita \`title\` e/ou \`folder\`
- \`DELETE /podcasts/:id\` — remove metadados + áudio

### Formato do roteiro (campo \`script\`)

Use as tags \`<NomeDaPersona>…</NomeDaPersona>\`. Cada nome deve ter uma voz em \`voices\`.

\`\`\`bash
curl -X POST http://127.0.0.1:${API_PORT}/podcasts \\
  -H 'Content-Type: application/json' -d '{
    "title": "Redes neurais — introdução",
    "folder": "IA",
    "voices": [
      { "name": "Ana", "voice": "pt-BR-FranciscaNeural" },
      { "name": "Bruno", "voice": "pt-BR-AntonioNeural" }
    ],
    "script": "<Ana>Olá! Hoje vamos falar de redes neurais.</Ana>\\n<Bruno>Boa! Começa explicando o que são.</Bruno>\\n<Ana>São modelos inspirados no cérebro…</Ana>"
  }'
# → 202 { "id": "...", "deepLink": "http://127.0.0.1:3333/#podcast/...", "status": "generating" }
\`\`\`

### Gerar a partir de texto (docmap escreve o roteiro)

\`\`\`bash
curl -X POST http://127.0.0.1:${API_PORT}/podcasts \\
  -H 'Content-Type: application/json' -d '{
    "title": "Kimi K3 — análise",
    "content": "<cole aqui o texto/artigo/resumo de estudo>",
    "folder": "IA"
  }'
# O docmap gera o diálogo via provider ativo (DeepSeek/Ollama) e sorteia 2 vozes.
\`\`\`

### Descobrir vozes disponíveis

\`\`\`bash
curl http://127.0.0.1:${API_PORT}/podcasts/voices
# → [{ "id": "pt-BR-AntonioNeural", "gender": "M", "style": "neutro, locução" }, ...]
\`\`\`

Deep link: \`GET /podcasts/:id\` retorna \`{ deepLink: "http://127.0.0.1:3333/#podcast/<id>" }\`.

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

### Mocks
1. \`GET /mocks/collections\` + \`GET /mocks\` — descubra o que já existe **antes** de criar qualquer coisa
2. Crie a collection se não existir, depois os mocks com script adequado
3. Teste com \`curl http://127.0.0.1:${MOCK_PORT}/seu-path\` para confirmar

---

## Mocks — Servidor HTTP em :${MOCK_PORT}

O docmap sobe um servidor de mocks em \`http://127.0.0.1:${MOCK_PORT}\`.
Cada mock tem um script JS executado a cada request. Os scripts recebem
\`ctx\` (request) e \`db\` (banco in-memory da collection) e devem retornar
\`{ status?, headers?, body? }\`.

### Protocolo para agentes — siga esta ordem

**Passo 1 — Descubra o estado atual (sempre, antes de criar qualquer coisa)**
\`\`\`bash
curl http://127.0.0.1:${API_PORT}/mocks/collections  # collections existentes
curl http://127.0.0.1:${API_PORT}/mocks              # todos os mocks existentes
\`\`\`

**Passo 2 — Crie a collection se não existir**
\`\`\`bash
curl -X POST http://127.0.0.1:${API_PORT}/mocks/collections \\
  -H 'Content-Type: application/json' -d '{"name":"Minha API"}'
# guarde o id retornado
\`\`\`

**Passo 3 — Crie os mocks**
Use \`db\` para mocks que precisam compartilhar estado (ex.: POST cria, GET lê).
Use dados hardcoded para mocks simples e estáticos.

**Passo 4 — Valide**
\`\`\`bash
curl http://127.0.0.1:${MOCK_PORT}/seu-path
\`\`\`

**Regras:**
- Nunca crie uma collection duplicada — verifique no passo 1
- Prefira \`group\` para organizar mocks do mesmo recurso (ex.: \`"group": "Users"\`)
- Scripts com lógica condicional (404, validação) são muito melhores que retornos estáticos
- Use \`db\` sempre que um mock precisar ler dados que outro escreveu

### Gerenciamento de Collections (via AI API :${API_PORT})

- \`GET /mocks/collections\` — lista collections
- \`GET /mocks/collections/:id\` — collection + seus mocks
- \`POST /mocks/collections\` — cria. Body: \`{ name }\`
- \`PUT /mocks/collections/:id\` — renomeia. Body: \`{ name }\`
- \`DELETE /mocks/collections/:id\` — remove collection e todos seus mocks
- \`DELETE /mocks/collections/:id/clear\` — zera os mocks da collection, **mantém a collection**
- \`DELETE /mocks/clear\` — apaga **tudo** (todas as collections e mocks)

### Gerenciamento de Mocks (via AI API :${API_PORT})

- \`GET /mocks\` — lista todos os mocks
- \`GET /mocks?collectionId=<id>\` — lista mocks de uma collection
- \`GET /mocks/:id\` — mock completo
- \`POST /mocks\` — cria mock. Body:
  \`\`\`json
  {
    "collectionId": "<uuid>",
    "method": "GET",
    "path": "/users/:id",
    "name": "Get user by ID",
    "group": "Users",
    "script": "return { status: 200, body: { id: ctx.params.id, name: 'Alice' } };"
  }
  \`\`\`
- \`PUT /mocks/:id\` — edita campos (parcial)
- \`DELETE /mocks/:id\` — remove

**Validação de duplicidade:** dentro de uma mesma collection, não é permitido ter dois mocks com o mesmo \`method\` + \`path\`. \`POST /mocks\` e \`PUT /mocks/:id\` retornam \`409 Conflict\` se o endpoint já existir.

Campos:
- \`method\`: GET | POST | PUT | PATCH | DELETE | HEAD | OPTIONS
- \`path\`: padrão com params (\`/users/:id\`, \`/posts/:postId/comments\`)
- \`name\`: label legível (opcional)
- \`group\`: agrupador visual dentro da collection (opcional)
- \`script\`: corpo de função JS que recebe \`ctx\` e retorna a resposta

### Script do mock

O script recebe **dois argumentos**: \`ctx\` (request) e \`db\` (banco in-memory da collection).

**\`ctx\`**: \`{ method, path, params, query, headers, body }\`

**\`db\`** — store in-memory compartilhado por todos os mocks da mesma collection (reseta ao reiniciar o app):
- \`db.set(key, value)\` — persiste um valor
- \`db.get(key)\` — retorna o valor ou \`undefined\`
- \`db.delete(key)\` — remove, retorna \`true\` se existia
- \`db.has(key)\` — verifica existência
- \`db.list(prefix)\` — array de todos os valores cujas chaves começam com \`prefix\`
- \`db.keys(prefix)\` — array de chaves com \`prefix\`
- \`db.clear()\` — apaga tudo desta collection
- \`db.size()\` — número de entradas

Exemplo — CRUD real entre mocks:
\`\`\`js
// POST /users — cria e persiste
const user = { id: String(db.size() + 1), ...ctx.body };
db.set('user:' + user.id, user);
return { status: 201, body: user };

// GET /users/:id — lê do db
const user = db.get('user:' + ctx.params.id);
if (!user) return { status: 404, body: { error: 'not_found' } };
return { status: 200, body: user };

// GET /users — lista todos
return { status: 200, body: db.list('user:') };

// DELETE /users/:id
db.delete('user:' + ctx.params.id);
return { status: 204 };
\`\`\`

Suporta async/await:
\`\`\`js
await new Promise(r => setTimeout(r, 200));
return { status: 200, body: db.list('user:') };
\`\`\`

### Chamando o servidor de mocks

\`\`\`bash
# Após criar o mock acima:
curl http://127.0.0.1:${MOCK_PORT}/users/42
# → { "id": "42", "name": "Alice" }
\`\`\`

Fluxo para criar um mock do zero:
1. \`POST /mocks/collections { "name": "Users API" }\` → obtém collectionId
2. \`POST /mocks { collectionId, method: "GET", path: "/users/:id", script: "..." }\`
3. \`curl http://127.0.0.1:${MOCK_PORT}/users/99\` — resposta do mock
`;
