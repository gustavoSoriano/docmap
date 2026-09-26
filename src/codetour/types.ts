// Tipos do codetour v4 — híbrido: estrutura extraída localmente (scan),
// semântica escrita pela IA. Sessão única temporária, sem KV.

export type TourDepth = 'resumo' | 'repasse' | 'deep';

export type TourLayer =
  | 'api'
  | 'service'
  | 'data'
  | 'ui'
  | 'test'
  | 'util';

export type TourSnippet = {
  readonly file: string;
  readonly code: string;
};

export type TourVisualKind = 'mermaid' | 'mindmap' | 'html';

// Bloco visual de um slide — a IA escolhe a tool certa para o momento.
export type TourVisual = {
  readonly kind: TourVisualKind;
  readonly title: string;
  readonly content: string;
};

export type TourSlide = {
  readonly id: string;
  readonly title: string;
  readonly bullets: readonly string[];
  readonly explain: string;
  readonly check: string;
  readonly narration: string;
  readonly snippet: TourSnippet | null;
  readonly visuals: readonly TourVisual[];
  readonly files: readonly string[];
};

export type TourFlowStep = {
  readonly label: string;
  readonly file: string;
  readonly detail: string;
};

export type TourContract = {
  readonly name: string;
  readonly input: string;
  readonly output: string;
  readonly notes: string;
};

export type CodeTour = {
  readonly topic: string;
  readonly goal: string;
  readonly slides: readonly TourSlide[];
  readonly flows: readonly TourFlowStep[];
  readonly contracts: readonly TourContract[];
  readonly keyFiles: readonly string[];
  readonly pitfalls: readonly string[];
  readonly nextSteps: readonly string[];
};

// ── Estrutura extraída localmente (Deno, determinística) ──

export type SymbolKind =
  | 'function'
  | 'class'
  | 'interface'
  | 'type'
  | 'const';

export type FileSymbol = {
  readonly name: string;
  readonly kind: SymbolKind;
};

export type FileImport = {
  readonly from: string;
  readonly resolved: string | null;
};

export type ScannedFile = {
  readonly path: string;
  readonly layer: TourLayer;
  readonly symbols: readonly FileSymbol[];
  readonly imports: readonly FileImport[];
};

export type StructurePack = {
  readonly root: string;
  readonly query: string;
  readonly scannedAt: string;
  readonly files: readonly ScannedFile[];
  readonly order: readonly string[];
  readonly truncated: boolean;
};

export type CodeTourSession = {
  readonly projectRoot: string;
  readonly query: string;
  readonly depth: TourDepth;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tour: CodeTour | null;
  readonly pack: StructurePack | null;
};

// Visão pública (sem o pack completo — ele vai em GET /codetour/structure).
export type PublicSession = {
  readonly projectRoot: string;
  readonly query: string;
  readonly depth: TourDepth;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tour: CodeTour | null;
  readonly scan: { readonly files: number; readonly truncated: boolean } | null;
  readonly layers: Readonly<Record<string, TourLayer>>;
};
