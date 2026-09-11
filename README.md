<div align="center">
  <img src="docs/assets/logo.svg" width="96" alt="docmap logo">
  <h1>docmap desktop</h1>
  <p>
    <strong>Atlas de documentação local com IA.</strong><br>
    Capture ideias, ilustre com diagramas,
    organize tarefas e transforme qualquer conteúdo em podcasts com slides —
    <strong>dados locais, sob seu controle</strong>.
  </p>

<p>
    <a href="https://github.com/gustavosoriano/docmap/releases"><img src="https://img.shields.io/github/v/release/gustavosoriano/docmap?color=6366f1&label=release" alt="release"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-6366f1" alt="license"></a>
    <a href="https://deno.land"><img src="https://img.shields.io/badge/built%20with-Deno-000000?logo=deno" alt="deno"></a>
    <a href="https://github.com/gustavosoriano/docmap/stargazers"><img src="https://img.shields.io/github/stars/gustavosoriano/docmap?style=social" alt="stars"></a>
  </p>
</div>

---

## Por que docmap?

A maioria das ferramentas de documentação depende da nuvem: seus arquivos, suas
ideias e seu histórico ficam em servidores que você não controla. O **docmap**
inverte isso: seus dados ficam na sua máquina — grafo, notas, desenhos, tasks,
favoritos e histórico local. Sem assinaturas e sem lock-in.

Ideal para:

- **Engenheiros e PMs** que querem mapear bases de código, RFCs e documentação
  de produto
- **Estudantes e pesquisadores** que estudam com conteúdo longo e precisam de
  podcasts em áudio
- **Times técnicos** que precisam de um hub local de conhecimento, mock servers,
  favoritos e kanban
- **Criadores de conteúdo** que querem transformar textos em episódios de áudio
  com slides visuais

---

## O que ele faz

| Módulo                       | O que resolve                                                        |
| ---------------------------- | -------------------------------------------------------------------- |
| **🕸️ Grafo de conhecimento** | Conecta entidades do DocMap por tags e referências                   |
| **🧠 Markmap**               | Transforma headings em mapa mental navegável                         |
| **📝 Notas globais**         | Knowledge base com busca full-text, categorias e tags                |
| **🎨 Lousa Canvas**          | Desenhe no tablet e veja em tempo real, com biblioteca de desenhos   |
| **🎙️ Podcasts em áudio**     | Sintetiza roteiros prontos com 2+ vozes                              |
| **🎬 Slides sincronizados**  | CSS art puro animado que troca conforme o áudio avança               |
| **✅ Kanban de tarefas**     | Organize tarefas e vincule a notas                                   |
| **🔀 Workflows multiagente** | Coordene Claude, Codex, opencode e outros agentes externos em um DAG |
| **🔖 Favoritos**             | Bookmarks inteligentes com tags, categorias e contador de acesso     |
| **🧪 Mocks HTTP**            | Servidor local de mocks para testar integrações                      |
| **🤖 API para agentes**      | Endpoint local para agentes e integrações próprias                   |
| **📦 GitHub Releases**       | Auto-update: o app baixa novas versões sozinho                       |

---

## Capturas de tela

<div align="center">
  <img src="docs/assets/screenshot-graph.png" alt="Grafo de conhecimento com 120 entidades e 154 conexões" width="100%">
  <br><br>
  <img src="docs/assets/screenshot-mermaid.png" alt="Diagramas Mermaid" width="49%">
  &nbsp;
  <img src="docs/assets/screenshot-markmap.png" alt="Mapa mental navegável" width="49%">
  <br><br>
  <img src="docs/assets/screenshot-podcast.png" alt="Podcast com slides sincronizados" width="100%">
  <br><br>
  <img src="docs/assets/screenshot-kanban.png" alt="Kanban de tarefas" width="49%">
  &nbsp;
  <img src="docs/assets/screenshot-mocks.png" alt="Mocks HTTP" width="49%">
  <br><br>
  <img src="docs/assets/screenshot-favorites.png" alt="Gerenciador de favoritos" width="49%">
</div>

---

## Principais diferenciais

### 🔒 100% local

Seus dados vivem em um arquivo SQLite no seu computador:

- macOS: `~/Library/Application Support/docmap/data.sqlite3`
- Linux: `~/.local/share/docmap/data.sqlite3`
- Windows: `%APPDATA%\docmap\data.sqlite3`

O caminho é fixo e independente do binário: atualizar o app nunca apaga suas
notas.

Por padrão, os servidores escutam apenas em `127.0.0.1`. Se você quiser usar o
canvas pelo tablet/celular na mesma rede, defina `DOCMAP_HOST=0.0.0.0`; nesse
modo, o acesso remoto fica limitado ao canvas e as rotas sensíveis continuam
restritas ao uso local.

Em desenvolvimento, `DOCMAP_KILL_PORTS=true` faz o app encerrar processos que
estejam segurando as portas locais antes do boot. Em uso normal, deixe essa
opção desativada.

### 🎙️ Podcasts + slides

O docmap sintetiza roteiros enviados por agentes externos em episódios de áudio
com **slides visuais sincronizados**, tudo em CSS art puro. Pause, acelere,
volte: os slides seguem o tempo do áudio naturalmente.

### 🧩 Extensível via API

A porta `:3334` expõe uma API REST para agentes. Integrações próprias podem
criar notas, desenhos, tasks, favoritos e podcasts, ou participar de workflows
persistidos declarando ferramenta, provider e modelo. O docmap coordena
dependências, claims, eventos e revisões sem iniciar nenhuma CLI.

### 🚀 Auto-update transparente

Binários são distribuídos via GitHub Releases. O app detecta novas versões e
atualiza sozinho — sem loja, sem gatekeeper.

---

## Stack técnica

- **Runtime:** [Deno](https://deno.land) (TypeScript strict)
- **Desktop:** [webview_deno](https://deno.land/x/webview) — janela nativa via
  WebKit/WebView2
- **Persistência:** [Deno KV](https://deno.land/kv) — SQLite embutido
- **Frontend:** Vanilla JS, D3.js + markmap, CSS puro
- **TTS:** edge-tts (offline-friendly)
- **Áudio:** ffmpeg / ffprobe
- **Build:** compilação nativa com `deno compile`

---

## Comece agora

### 1. Requisitos

- [Deno](https://deno.land/#installation) instalado
- Para podcasts: `edge-tts` (`pip install edge-tts`) e `ffmpeg`
  (`brew install ffmpeg`)

### 2. Clone e rode

```bash
git clone https://github.com/gustavosoriano/docmap.git
cd docmap
deno task dev
```

### 3. Instale como app (macOS)

```bash
./install.sh
```

Isso cria `DocMap.app` em `/Applications` e registra o comando `docmap` no
terminal.

### 4. Compile um binário

```bash
deno task build
mv docmap-app docmap-macos-aarch64
```

---

## Lançar uma nova versão

O app se atualiza sozinho lendo os GitHub Releases do repositório configurado.

1. Ajuste a versão em `src/config.ts`:
   ```ts
   export const APP_VERSION = '1.1.0';
   ```
2. Compile e renomeie o binário:
   ```bash
   deno task build
   mv docmap-app docmap-macos-aarch64
   shasum -a 256 docmap-macos-aarch64 > docmap-macos-aarch64.sha256
   ```
3. Crie o release:
   ```bash
   gh release create v1.1.0 \
     docmap-macos-aarch64 \
     docmap-macos-aarch64.sha256 \
     --title "v1.1.0" \
     --notes "Descrição das mudanças"
   ```

Na próxima vez que o app abrir, ele detecta a nova versão e atualiza
automaticamente.

> Veja [README-RELEASE.md](README-RELEASE.md) para detalhes completos de release
> multiplataforma.

---

## Arquitetura e contribuição

- Princípios, estrutura de módulos e antipatterns: [CLAUDE.md](CLAUDE.md)
- Guia de API para agentes: [SKILL.md](SKILL.md)
- Política de segurança: [SECURITY.md](SECURITY.md)
- Dependências de terceiros vendorizadas:
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)

Contribuições são bem-vindas! Abra uma issue, envie um PR ou sugira uma nova
funcionalidade.

---

## Licença

Distribuído sob licença **MIT**. Veja [LICENSE](LICENSE) para o texto completo.

Use, modifique e venda sem burocracia. O código é seu.

---

<p align="center">
  Feito com carinho por <a href="https://github.com/gustavosoriano">@gustavosoriano</a>
</p>
