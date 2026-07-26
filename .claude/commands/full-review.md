---
description: Roda logic-reviewer, code-quality-reviewer e crash-hunter em paralelo sobre as mudanças atuais e sintetiza um relatório único priorizado.
---

Dispare os três sub-agentes abaixo **em paralelo, na mesma mensagem** (múltiplas chamadas de Task/subagente numa só resposta, não sequencialmente), todos analisando o mesmo escopo: as mudanças atuais (`git diff HEAD`, ou o diff/PR indicado pelo usuário).

1. **logic-reviewer** — lógica, bugs, edge cases, regressões, comportamento inesperado
2. **code-quality-reviewer** — dead code, erros silenciados, anti-patterns, débito técnico
3. **crash-hunter** — cenários de crash, exceções não tratadas, falhas de runtime

Depois que os três retornarem, sintetize tudo em um único relatório:

1. Remova duplicatas entre os agentes (se dois agentes apontarem o mesmo problema, mantenha só uma entrada, citando ambas as perspectivas)
2. Ordene por severidade: Crítico → Alto → Médio → Baixo
3. Para cada item, inclua: arquivo, linha, descrição, e sugestão de correção
4. No final, dê um veredito objetivo:
   - **✅ Pronto pra merge** — nenhum problema crítico/alto
   - **⚠️ Precisa de atenção** — problemas médios que valem corrigir mas não bloqueiam
   - **❌ Precisa de trabalho** — existe pelo menos um problema crítico ou alto

Não invente achados apenas para preencher o relatório — se um agente não encontrar nada, reflita isso no resumo.
