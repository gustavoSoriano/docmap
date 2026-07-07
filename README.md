# docmap desktop

Atlas de documentação: grafo de arquivos `.md`, mapa mental (markmap), busca,
anotações contextuais e uma base de notas acessível por IA — tudo local, sem servidor.

## Rodar em desenvolvimento

```bash
deno task dev
```

## Onde ficam os dados

```
macOS:   ~/Library/Application Support/docmap/data.sqlite3
Linux:   ~/.local/share/docmap/data.sqlite3
Windows: %APPDATA%\docmap\data.sqlite3
```

Esse caminho é **fixo** e independente do binário — atualizar o app nunca apaga
notas ou anotações. Faça `⇩ Backup` na aba Notas de vez em quando mesmo assim.

---

## Como versionar / lançar uma nova versão

O app se atualiza sozinho lendo os **GitHub Releases** do repositório configurado.
Não há servidor: o GitHub é a hospedagem estática dos binários.

### Configuração única (primeira vez)

1. Crie o repositório no GitHub.
2. Em [`src/config.ts`](src/config.ts), ajuste `GITHUB_REPO` para `seu-usuario/docmap`
   (ou defina a env `DOCMAP_REPO` ao rodar).

### A cada nova versão

1. **Suba a versão** em [`src/config.ts`](src/config.ts):
   ```ts
   export const APP_VERSION = '1.1.0';   // era 1.0.0
   ```
   Use [SemVer](https://semver.org): `MAJOR.MINOR.PATCH`.

2. **Compile** o binário para a plataforma alvo:
   ```bash
   deno task build
   ```
   Isso gera `docmap-app`. Renomeie seguindo o padrão que o updater espera —
   `docmap-<os>-<arch>`:
   ```bash
   mv docmap-app docmap-macos-aarch64      # Mac Apple Silicon
   # mv docmap-app docmap-macos-x86_64     # Mac Intel
   # mv docmap-app docmap-linux-x86_64     # Linux
   ```

3. **Crie o Release** no GitHub com a tag igual à versão e anexe o binário:
   ```bash
   gh release create v1.1.0 docmap-macos-aarch64 \
     --title "v1.1.0" \
     --notes "Descreva as mudanças aqui"
   ```
   > A tag (`v1.1.0`) precisa bater com o `APP_VERSION` (o `v` é opcional na comparação).

4. **Pronto.** Na próxima vez que o app abrir, ele detecta a versão nova, mostra o
   banner de atualização e — ao confirmar — baixa o binário, troca por cima do atual
   e pede para reiniciar.

### Como a checagem funciona

```
app abre ─► GET api.github.com/repos/<repo>/releases/latest
         ─► compara tag_name vs APP_VERSION (numérico, por segmento)
         ─► se maior: procura asset "docmap-<os>-<arch>"
         ─► grava status no KV ─► UI mostra o banner
```

Se estiver offline, a checagem falha em silêncio e o app abre normalmente.

### Regras de schema (dados)

Se uma versão mudar a **estrutura** dos dados no KV, adicione uma migração em
[`src/kv/migrate.ts`](src/kv/migrate.ts) (um item novo no array `migrations`).
Nunca edite migrações antigas — elas já rodaram na máquina dos usuários.

---

## Arquitetura

Veja [CLAUDE.md](CLAUDE.md) para os princípios, estrutura de módulos e antipatterns.
