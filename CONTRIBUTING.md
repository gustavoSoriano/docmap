# Contribuindo

Obrigado por querer melhorar o docmap.

## Ambiente

```bash
deno task dev
```

Antes de abrir um PR, rode:

```bash
deno task check
deno task lint
deno task test
```

## Segurança

Não versione dados locais, backups, bancos SQLite, binários compilados, `.env`
reais ou configurações pessoais de agentes. O `.env.example` deve conter apenas
nomes de variáveis e valores seguros.

Mudanças que exponham novas rotas HTTP, executem subprocessos, leiam/escrevam
arquivos ou alterem o auto-update devem mencionar o impacto de segurança no PR.
