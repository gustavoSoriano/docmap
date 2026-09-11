# DocMap Desktop — Guia de Arquitetura

## Stack

- **Runtime**: Deno (TypeScript strict)
- **Desktop**: webview_deno — janela nativa via WebKit (macOS) / WebView2
  (Windows)
- **Persistência**: Deno KV built-in — zero dependências externas
- **Frontend**: D3.js + markmap-autoloader via CDN, CSS puro, JS vanilla

## Servidores

| Porta | Propósito                                 | Acesso        |
| ----- | ----------------------------------------- | ------------- |
| 3333  | UI (serve HTML/CSS/JS + API da interface) | loopback      |
| 3334  | AI API (CRUD de notas para agentes)       | loopback only |

## Estrutura de módulos

```
src/
  main.ts              ← entry: inicializa KV, sobe servidores, abre janela
  kv.ts                ← singleton Deno KV (única exceção ao estado global)
  notes/               ← tipos, store KV, busca, exportação
  comments/            ← tipos, store KV (comentários nos nós do markmap)
  fs/                  ← walker e extração de links (funções puras)
  graph/               ← construção do grafo (função pura)
  podcasts/            ← tipos, store KV, pipeline de geração (edge-tts + ffmpeg), TTS
  server/              ← servidor :3333 (handlers da UI)
  api/                 ← servidor :3334 (handlers da AI API)
  window/              ← webview e folder picker
ui/
  styles/              ← CSS por camada (tokens → layout → componentes)
  scripts/             ← JS por domínio (sem frameworks, sem bundler)
```

## Princípios

### Programação Funcional

- **Funções puras** para toda transformação de dados: `fs/`, `graph/`,
  `search/`, `notes/search.ts`, `notes/export.ts`
- **Side effects isolados** em: `notes/store.ts`, `comments/store.ts`,
  `server/handlers/`, `api/handlers/`, `window/`
- **Sem classes** — objetos simples + funções
- **Sem mutação** fora dos módulos de store e do estado local de runtime

### Isolamento de responsabilidade

Cada arquivo tem **uma única responsabilidade**. Se um arquivo ultrapassar ~100
linhas, é sinal de que precisa ser dividido.

### Tipagem

- `strict: true` em todos os arquivos
- Sem `any` — use `unknown` quando necessário e faça type narrowing explícito
- Tipos de domínio ficam em `types.ts` dentro do módulo correspondente
- Prefira `readonly` em tipos imutáveis

### Chaves do Deno KV

```
["_meta",          "schemaVersion"]              → number (versão do schema)
["_meta",          "update"]                     → UpdateStatus
["notes",          "_global_", noteId]           → Note
["tasks",          "_global_", taskId]           → Task
["projects",       "_global_", projectId]        → Project
["favorites",      id]                           → Favorite
["diagrams",       "_global_", diagramId]        → Diagram
["macros",         "_global_", macroId]          → Macro
["macro_collections", id]                      → MacroCollection
["skills",         "_global_", skillId]          → Skill
["skill_collections", id]                      → SkillCollection
["comments",       "_global_", fileId]          → Comment[]
["canvas_collections", id]                       → DrawingCollection
["canvas_drawings",  collectionId, drawingId]    → DrawingMeta (snapshot vai em `<dataDir>/drawings/<collectionId>/<drawingId>.json`)
["podcasts",       "_global_", podcastId]        → Podcast (metadados; áudio MP3 vai no filesystem)
["mock_collections", id]                         → MockCollection
["mocks_data",     collectionId, mockId]         → Mock
```

> Notes e comments são escopo global (`_global_`).

## Persistência e atualização

**Local dos dados (fixo, sobrevive a updates):**

```
macOS:   ~/Library/Application Support/docmap/data.sqlite3
Linux:   ~/.local/share/docmap/data.sqlite3
Windows: %APPDATA%\docmap\data.sqlite3
```

Definido em `src/config.ts`. NUNCA usar `Deno.openKv()` sem caminho — o default
é um hash do caminho do binário e muda a cada build, órfãozando os dados. Sempre
`openAppKv()` de `src/kv/path.ts`.

**Migração de schema:** `src/kv/migrate.ts` — chave `["_meta","schemaVersion"]`.
Cada migração leva de N para N+1. Adicione novas ao array `migrations`, nunca
edite as antigas.

**Podcasts (binários externos):** o módulo `src/podcasts/` é o único domínio que
escreve arquivos fora do KV — o áudio MP3 fica em `<dataDir>/podcasts/<id>.mp3`
(KV tem limite de ~64 KiB/valor, áudio é maior). A geração depende de **3
binários externos não empacotados**: `edge-tts` (Python,
`pip install edge-tts`), `ffmpeg` e `ffprobe` (`brew install ffmpeg`). Paths
configuráveis via env `DOCMAP_EDGE_TTS`, `DOCMAP_FFMPEG`, `DOCMAP_FFPROBE`. O
endpoint `GET /podcasts/health` (função em `src/podcasts/health.ts`) verifica os
três e devolve instruções de instalação; o `POST /podcasts` faz fail-fast se
faltar algum. A geração é assíncrona: o POST retorna 202 e o pipeline
(`src/podcasts/pipeline.ts`) roda em background, gravando `status` no KV
(`generating`→`ready`/`error`) e emitindo eventos SSE. O roteiro pronto e os
slides podem ser enviados por agentes externos; o parser em
`src/podcasts/parser.ts` valida as tags `<Person1>…</Person1>`. Sempre 2+
personas com vozes pt-BR distintas.

**Backup/restore:** `src/kv/backup.ts` — exporta/importa todo o KV em JSON.
Endpoints `/system/backup` e `/system/restore`.

**Env vars e `.env`:** apps GUI no macOS não herdam variáveis do shell
(`~/.zshrc`). `src/env.ts` lê um arquivo `.env` no diretório de dados do app
(ex.: `~/Library/Application Support/docmap/.env`) e define as vars via
`Deno.env.set()` antes de `config.ts` ser avaliado. Deve ser importado como
primeiro módulo em `main.ts` e `worker.ts`. Valores já definidas no ambiente têm
precedência.

**Auto-update:** `src/update/github.ts` checa GitHub Releases no boot;
`src/update/apply.ts` baixa o binário, valida SHA-256 e renomeia por cima do
atual. Configurar repo via `GITHUB_REPO` (env `DOCMAP_REPO`). Assets devem se
chamar `docmap-<os>-<arch>` (ex.: `docmap-macos-aarch64`) e ter um asset
`<nome>.sha256` ou `SHA256SUMS`. Bump `APP_VERSION` a cada release.

## Segurança

- **Path traversal**: qualquer caminho de arquivo externo deve ser validado
  antes de ler
- **Permissões Deno mínimas**: `--allow-read=<ROOT>` em produção, não
  `--allow-read` global
- **UI principal** (`:3333`) bind padrão em `127.0.0.1`; `DOCMAP_HOST=0.0.0.0`
  só deve expor rotas públicas do canvas
- **AI API** (`:3334`) bind exclusivo em `127.0.0.1` — nunca em `0.0.0.0`
- **Sem eval()** em qualquer módulo — especialmente nos handlers HTTP
- **Sanitização de HTML** obrigatória antes de inserir dados do usuário no DOM
  (`escHtml` / `renderMarkdown` em `dom.js`)

## Antipatterns — não faça isso

- ❌ Estado global mutável fora de `kv.ts`
- ❌ Escrever qualquer arquivo na pasta do projeto monitorado (read-only)
- ❌ Funções com mais de 30 linhas que fazem múltiplas coisas
- ❌ `default export` — use named exports para rastreabilidade
- ❌ Misturar lógica de domínio com lógica de HTTP nos handlers
- ❌ Inline styles via JS — toda estética fica no CSS
- ❌ `fetch` sem validação de path no servidor
- ❌ Commits de `deno.lock` modificado sem rodar `deno cache` antes
- ❌ Handlers que retornam dados sem `Content-Type` correto

## Padrão de handler HTTP

```ts
// Separar: lógica de domínio fica no store/engine, handler só orquestra
export const createNotesHandler =
  (deps: HandlerDeps) => async (req: Request): Promise<Response> => {
    const { kv } = deps;
    // ...
  };
```

## Padrão de resposta JSON

```ts
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
```
