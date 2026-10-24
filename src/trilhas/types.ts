export type TrilhaStatus = 'draft' | 'running' | 'done' | 'cancelled';

export type TrilhaNodeStatus = 'todo' | 'doing' | 'done' | 'blocked';

export type TrilhaCriterion = {
  readonly id: string;
  readonly text: string;
  readonly done: boolean;
};

// Entrada aceita objeto completo ou string curta (vira { text, done: false }).
export type TrilhaCriterionInput = string | {
  readonly id?: string;
  readonly text: string;
  readonly done?: boolean;
};

export type AssigneeKind = 'human' | 'ai';

export type Assignee = {
  readonly kind: AssigneeKind;
  readonly label: string;
};

export type Trilha = {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly status: TrilhaStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
};

export type TrilhaNode = {
  readonly id: string;
  readonly trilhaId: string;
  readonly title: string;
  readonly details: string;
  readonly result: string;
  readonly doneCriteria: readonly TrilhaCriterion[];
  readonly blockedReason?: string;
  readonly status: TrilhaNodeStatus;
  readonly assignee: Assignee;
  // Agrupamento visual (coluna/frente). Livre, ex.: o nome da app.
  readonly group?: string;
  readonly claimedBy?: string;
  readonly claimedAt?: string;
  readonly lastHeartbeatAt?: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TrilhaEdge = {
  readonly id: string;
  readonly trilhaId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly createdAt: string;
};

export type StickyColor = 'yellow' | 'pink' | 'green' | 'blue';

export type TrilhaSticky = {
  readonly id: string;
  readonly trilhaId: string;
  readonly text: string;
  readonly color: StickyColor;
  readonly position: { readonly x: number; readonly y: number };
  readonly createdAt: string;
  readonly updatedAt: string;
};

// ── Referências: ponte entre a trilha e os artefatos do docmap ──
export type RefKind = 'note' | 'skill' | 'macro' | 'podcast' | 'favorite';

// guardrail = regra inegociável (sempre no topo do pacote de contexto);
// context = material de apoio.
export type RefRole = 'guardrail' | 'context';

export type TrilhaRef = {
  readonly id: string;
  readonly trilhaId: string;
  readonly kind: RefKind;
  readonly targetId: string;
  readonly role: RefRole;
  // Ausente = fixada na trilha inteira (Arsenal); presente = anexada ao bloco.
  readonly nodeId?: string;
  readonly createdAt: string;
};

export type CreateRefInput = {
  readonly kind: RefKind;
  readonly targetId: string;
  readonly role?: RefRole;
  readonly nodeId?: string;
};

// Ref + dados do alvo resolvidos no servidor (título, tags, existência).
export type ResolvedRef = TrilhaRef & {
  readonly title: string;
  readonly tags: readonly string[];
  readonly missing?: true;
  readonly extra?: Readonly<Record<string, string>>;
};

// ── Sinais: bloqueio, aviso, pergunta e pendência ──
export type SignalKind = 'blocker' | 'warning' | 'question' | 'pending';

export type TrilhaSignal = {
  readonly id: string;
  readonly trilhaId: string;
  readonly nodeId?: string;
  readonly kind: SignalKind;
  readonly text: string;
  readonly by?: string;
  readonly status: 'open' | 'resolved';
  readonly resolution?: string;
  readonly createdAt: string;
  readonly resolvedAt?: string;
  readonly resolvedBy?: string;
};

export type CreateSignalInput = {
  readonly kind: SignalKind;
  readonly text: string;
  readonly nodeId?: string;
  readonly by?: string;
};

export type ResolveSignalInput = {
  readonly resolution?: string;
  readonly by?: string;
};

// ── Fila de atenção e saúde (derivadas, nunca persistidas) ──
export type AttentionKind = SignalKind | 'stale';

export type AttentionItem = {
  readonly id: string;
  readonly kind: AttentionKind;
  readonly source: 'signal' | 'node' | 'claim';
  readonly nodeId?: string;
  readonly signalId?: string;
  readonly text: string;
  readonly by?: string;
  readonly at: string;
};

export type TrilhaHealth = {
  readonly total: number;
  readonly done: number;
  readonly doing: number;
  readonly todo: number;
  readonly blocked: number;
  readonly readyForAi: number;
  readonly waitingHuman: number;
  readonly stale: number;
  readonly activeAgents: readonly string[];
  readonly open: Readonly<Record<SignalKind, number>>;
};

export type TrilhaDetail = {
  readonly trilha: Trilha;
  readonly nodes: readonly TrilhaNode[];
  readonly edges: readonly TrilhaEdge[];
  readonly stickies: readonly TrilhaSticky[];
  readonly refs: readonly ResolvedRef[];
  readonly signals: readonly TrilhaSignal[];
  readonly attention: readonly AttentionItem[];
  readonly health: TrilhaHealth;
};

export type CreateTrilhaInput = {
  readonly title: string;
  readonly objective: string;
  readonly description?: string;
  readonly tags?: readonly string[];
};

export type UpdateTrilhaInput = {
  readonly title?: string;
  readonly objective?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly status?: TrilhaStatus;
};

export type CreateNodeInput = {
  readonly title: string;
  readonly details?: string;
  readonly result?: string;
  readonly doneCriteria?: readonly TrilhaCriterionInput[];
  readonly blockedReason?: string;
  readonly status?: TrilhaNodeStatus;
  readonly assignee?: Assignee;
  readonly group?: string;
  readonly position?: { readonly x: number; readonly y: number };
  readonly dependsOn?: readonly string[];
};

export type UpdateNodeInput = {
  readonly title?: string;
  readonly details?: string;
  readonly result?: string;
  readonly doneCriteria?: readonly TrilhaCriterionInput[];
  readonly blockedReason?: string;
  readonly status?: TrilhaNodeStatus;
  readonly assignee?: Assignee;
  readonly group?: string;
  readonly position?: { readonly x: number; readonly y: number };
  readonly by?: string;
  readonly expectedUpdatedAt?: string;
};

export type ClaimInput = {
  readonly by: string;
  readonly force?: boolean;
};

export type HeartbeatInput = {
  readonly by: string;
};

export type CreateEdgeInput = {
  readonly fromNodeId: string;
  readonly toNodeId: string;
};

export type CreateStickyInput = {
  readonly text: string;
  readonly color?: StickyColor;
  readonly position?: { readonly x: number; readonly y: number };
};

export type UpdateStickyInput = {
  readonly text?: string;
  readonly color?: StickyColor;
  readonly position?: { readonly x: number; readonly y: number };
};
