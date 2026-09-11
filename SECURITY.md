# Security Policy

## Superfície local

O docmap roda como app local e expõe servidores HTTP apenas para integração com
a própria UI e agentes locais.

- UI: `127.0.0.1:3333` por padrão.
- API para agentes: `127.0.0.1:3334`.
- Mocks HTTP: `127.0.0.1:3335`.

Definir `DOCMAP_HOST=0.0.0.0` expõe somente o canvas na rede local. Rotas de
terminal, macros, sistema, notas, backups, restore e update são bloqueadas para
hosts que não sejam loopback.

## Recursos de alto impacto

O terminal integrado abre um shell real do usuário. Macros também executam
scripts criados pelo usuário. Não execute macros recebidas de terceiros sem
revisar o conteúdo.

O auto-update exige um checksum SHA-256 publicado no mesmo GitHub Release. O
update é recusado quando o checksum está ausente ou não confere.

`DOCMAP_KILL_PORTS=true` deve ser usado apenas em desenvolvimento: ele encerra
processos que estejam ocupando as portas locais do app.

## Reportar vulnerabilidade

Abra uma issue privada ou entre em contato com o mantenedor antes de divulgar
publicamente uma vulnerabilidade explorável. Inclua passos de reprodução, versão
afetada e impacto esperado.
