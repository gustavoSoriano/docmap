// ════ Monitors — vigias autônomos operados por agentes externos ════
// O docmap é o relógio e o ledger: ele decide QUANDO um monitor pode rodar,
// guarda o estado entre execuções e aplica guardrails/orçamento. Quem executa
// é sempre um agente externo (Codex, Claude, opencode etc.), que traz as
// próprias fontes e ferramentas. Nenhum LLM é chamado pelo docmap.

export type MonitorStatus =
  | 'active' // pode receber ticks
  | 'paused' // parado pelo usuário (ou idle automático)
  | 'halted' // parada dura por guardrail (expirou, estourou, falhas)
  | 'review' // IA propôs done; aguarda decisão humana
  | 'done'; // objetivo concluído e confirmado

export type MonitorRunStatus =
  | 'leased' // reservado por um agente, ainda sem sinal de vida
  | 'working' // agente mandou heartbeat
  | 'no-change' // rodou e não havia nada novo
  | 'done' // agente declarou objetivo concluído (pode ir para review)
  | 'failed' // erro na execução
  | 'expired'; // agente sumiu sem reportar (lease venceu)

export type MonitorActionStatus =
  | 'pending' // aguardando decisão humana
  | 'approved' // liberada para o agente executar
  | 'rejected' // negada
  | 'executed' // agente executou e reportou sucesso
  | 'failed'; // agente tentou e falhou

export type MonitorLimits = {
  readonly maxRuns?: number; // teto total (opcional)
  readonly maxRunsPerDay: number;
  readonly maxTokensPerDay: number;
  readonly maxCostUsdPerDay: number;
  readonly maxConsecutiveFailures: number;
  readonly idleRunsToPause: number; // no-change seguidos até pausar
  readonly runTimeoutMinutes: number; // validade do lease
  readonly expiresAt?: string; // ISO; expira e para sozinho
};

export type MonitorLimitsInput =
  & Partial<Omit<MonitorLimits, 'expiresAt' | 'maxRuns'>>
  & {
    readonly maxRuns?: number | null;
    readonly expiresAt?: string | null; // null/'' remove o prazo
  };

export type MonitorState = {
  readonly cursor: string; // marcador opaco controlado pelo agente
  readonly memory: string; // memória compacta entre execuções
  readonly consecutiveNoChange: number;
  readonly consecutiveFailures: number;
};

export type MonitorUsage = {
  readonly day: string; // YYYY-MM-DD (UTC) do balde diário
  readonly runsToday: number;
  readonly tokensToday: number;
  readonly costToday: number;
  readonly runsTotal: number;
  readonly tokensTotal: number;
  readonly costTotal: number;
};

export type Monitor = {
  readonly id: string;
  readonly title: string;
  readonly objective: string; // o que o agente deve fazer (fonte fica no agente)
  readonly status: MonitorStatus;
  readonly intervalMinutes: number;
  readonly nextRunAt: string | null;
  readonly lastRunAt: string | null;
  readonly guardrails: readonly string[]; // texto livre (vai no prompt)
  readonly doneCriteria: readonly string[]; // o que conta como concluído
  readonly requireDoneApproval: boolean;
  readonly tags: readonly string[]; // tema/assunto — eixo do grafo
  readonly limits: MonitorLimits;
  readonly state: MonitorState;
  readonly usage: MonitorUsage;
  readonly lastRunSeq: number;
  readonly haltReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type MonitorCriterionResult = {
  readonly index: number; // 1-based, casa com a ordem em doneCriteria
  readonly text: string;
  readonly done: boolean;
  readonly evidence?: string;
};

export type MonitorRun = {
  readonly id: string;
  readonly monitorId: string;
  readonly seq: number;
  readonly status: MonitorRunStatus;
  readonly agent: string;
  readonly leasedAt: string;
  readonly leaseExpiresAt: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
  readonly summary?: string;
  readonly evidence?: string;
  readonly error?: string;
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly costUsd: number;
  readonly hasReport: boolean;
  readonly criteria: readonly MonitorCriterionResult[];
};

export type CreateMonitorInput = {
  readonly title: string;
  readonly objective: string;
  readonly intervalMinutes?: number;
  readonly guardrails?: readonly string[];
  readonly doneCriteria?: readonly string[];
  readonly requireDoneApproval?: boolean;
  readonly limits?: MonitorLimitsInput;
  readonly tags?: readonly string[];
  readonly startNow?: boolean;
};

export type UpdateMonitorInput = {
  readonly title?: string;
  readonly objective?: string;
  readonly intervalMinutes?: number;
  readonly guardrails?: readonly string[];
  readonly doneCriteria?: readonly string[];
  readonly requireDoneApproval?: boolean;
  readonly limits?: MonitorLimitsInput;
  readonly tags?: readonly string[];
};

export type ReportRunInput = {
  readonly status: 'no-change' | 'done' | 'failed';
  readonly summary?: string;
  readonly report?: string;
  readonly evidence?: string;
  readonly criteria?: readonly {
    readonly index?: number;
    readonly text?: string;
    readonly done?: boolean;
    readonly evidence?: string;
  }[];
  readonly agent?: string;
  readonly state?: {
    readonly cursor?: string;
    readonly memory?: string;
  };
  readonly usage?: {
    readonly tokensIn?: number;
    readonly tokensOut?: number;
    readonly costUsd?: number;
  };
};

export type DecideMonitorInput = {
  readonly decision: 'accept' | 'reject';
  readonly by?: string;
};
