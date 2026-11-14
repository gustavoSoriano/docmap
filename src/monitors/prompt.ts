// Prompt copiável do monitor — o mesmo texto que a IA cola para operar.
// Fontes e ferramentas são do agente; o docmap só dá o relógio e o contrato.

import type { Monitor } from './types.ts';
import { remainingBudget } from './policy.ts';

const UI = 'http://127.0.0.1:3333';
const API = 'http://127.0.0.1:3334';

const lines = (title: string, items: readonly string[]): string[] =>
  items.length
    ? [`### ${title}`, '', ...items.map((item) => `- ${item}`), '']
    : [];

const numbered = (title: string, items: readonly string[]): string[] =>
  items.length
    ? [`### ${title}`, '', ...items.map((item, i) => `${i + 1}. ${item}`), '']
    : [];

export const buildMonitorPrompt = (monitor: Monitor): string => {
  const budget = remainingBudget(monitor);
  const criteriaJson = monitor.doneCriteria.length
    ? `    "criteria": [${
      monitor.doneCriteria.map((_, i) =>
        `{ "index": ${i + 1}, "done": true, "evidence": "..." }`
      ).join(', ')
    }],\n`
    : '';

  return `# Monitor Docmap — ${monitor.title}

Você é o agente executor deste monitor. O docmap NÃO executa nada e NÃO
conhece suas fontes: canais, portais, APIs, conectores, skills e ferramentas
são seus. O docmap só controla o relógio, o orçamento, o estado e as travas.

- id do monitor: \`${monitor.id}\`
- UI humana: ${UI}/#monitor/${monitor.id}
- intervalo: a cada ${monitor.intervalMinutes} minutos
- status atual: ${monitor.status}

## Objetivo

${monitor.objective || '(sem objetivo escrito — pare e peça ao usuário)'}

${lines('Guardrails (texto — siga à risca)', monitor.guardrails).join('\n')}${
    numbered(
      'Critérios de conclusão (obrigatórios para done)',
      monitor.doneCriteria,
    ).join('\n')
  }## Orçamento e paradas (aplicados pelo docmap, não por você)

| Limite | Valor |
|---|---|
| execuções hoje | ${monitor.usage.runsToday}/${monitor.limits.maxRunsPerDay} |
| tokens hoje | ${monitor.usage.tokensToday}/${monitor.limits.maxTokensPerDay} |
| custo hoje | US$ ${monitor.usage.costToday}/US$ ${monitor.limits.maxCostUsdPerDay} |
| falhas seguidas | ${monitor.state.consecutiveFailures}/${monitor.limits.maxConsecutiveFailures} |
| execuções sem novidade | ${monitor.state.consecutiveNoChange}/${monitor.limits.idleRunsToPause} |
| lease de cada execução | ${monitor.limits.runTimeoutMinutes} min |
| prazo final | ${monitor.limits.expiresAt ?? '(sem prazo)'} |

Saldo de hoje: ${budget.runs} execuções, ${budget.tokens} tokens, US$ ${budget.costUsd}.

Se o docmap parar de entregar ticks, NÃO insista: o monitor foi pausado ou
parado por guardrail. Avise o usuário e pare.

**Paused = pare agora.** Se \`GET /monitors/${monitor.id}\` mostrar
\`status: "paused"\`, \`"halted"\`, \`"review"\` ou \`"done"\`, encerre sua espera e
avise o humano. Só o humano retoma; NUNCA chame \`/resume\` por conta própria.
Ao retomar, você será avisado e volta a esperar no inbox.

## Estado deixado pela execução anterior

- cursor: ${monitor.state.cursor || '(vazio)'}
- memória: ${monitor.state.memory || '(vazia)'}

Use \`cursor\` para não reprocessar o que já viu (ex.: timestamp da última
mensagem, id do último alerta). Use \`memory\` para o resumo operacional
curto que a próxima execução precisa saber. Não despeje logs aqui.

## Protocolo — siga nesta ordem

1. **Espere trabalho** com long-poll (uma chamada segura a conexão; não gasta tokens):
\`\`\`bash
curl -s "${API}/monitors/inbox?agent=<seu-nome>&wait=600"
\`\`\`
Resposta \`{ "due": false }\` = nada vencido; chame de novo imediatamente.
Quando vier um run, siga com ele. NUNCA faça polling em loop curto.

2. **Assuma o run** (se você já sabe o id do monitor):
\`\`\`bash
curl -s -X POST "${API}/monitors/${monitor.id}/tick" \\
  -H 'Content-Type: application/json' -d '{"agent":"<seu-nome>"}'
\`\`\`
A resposta traz \`run\`, \`monitor\`, \`prompt\` e \`remainingBudget\`.
Um run por monitor: se outro agente já pegou, o docmap recusa.

3. **Execute** com suas próprias ferramentas. Compare com o cursor; se nada
mudou de relevante, não invente trabalho.

4. **Sinal de vida** a cada ~5 min de execução:
\`\`\`bash
curl -s -X POST "${API}/monitors/runs/<runId>/heartbeat" \\
  -H 'Content-Type: application/json' -d '{"agent":"<seu-nome>"}'
\`\`\`

5. **Reporte sempre** (inclusive quando nada mudou):
\`\`\`bash
curl -s -X POST "${API}/monitors/runs/<runId>/report" \\
  -H 'Content-Type: application/json' -d '{
    "status": "no-change",
    "summary": "Nada novo desde o último cursor.",
    "state": { "cursor": "<novo-cursor>", "memory": "<resumo curto>" },
${criteriaJson}    "usage": { "tokensIn": 1200, "tokensOut": 300, "costUsd": 0.01 }
  }'
\`\`\`
- \`status\`: \`no-change\` | \`done\` | \`failed\` — nunca outro valor.
- \`report\` (opcional): markdown completo; a timeline guarda e abre o arquivo.
- \`usage\` é **autodeclarado**; o docmap usa para cortar o orçamento.
- Para \`done\`, envie \`criteria\` com **todos** os critérios marcados (\`index\` 1-based). O docmap recusa \`done\` incompleto.
- \`done\` também exige \`evidence\` não vazia.

6. **Concluir** só quando os critérios estiverem comprovados: reporte
\`done\` com \`evidence\`. Se o monitor exigir confirmação humana, ele vai
para \`review\` e espera a decisão; não force a conclusão.

## Regras duras

- Um único run por vez por monitor; nunca tente burlar o lease.
- Se o lease vencer, o run vira \`expired\`, conta como falha e pode parar o monitor.
- Não repita a mesma checagem cara se o cursor mostra que nada mudou.
- Sem novidade é um resultado válido: reporte \`no-change\` e durma no inbox.
- O docmap manda no orçamento: quando ele cortar, pare sem tentar contornar.
- Fontes, credenciais e ferramentas são SUAS. O docmap não sabe o que você acessa.
`;
};
