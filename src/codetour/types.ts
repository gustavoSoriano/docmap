// Tipos do caderno v7 (reels) — híbrido: estrutura extraída localmente (scan),
// semântica escrita pela IA. Sessão única temporária, sem KV.
import type { ArtifactKind } from './artifacts.ts';

export type TourDepth = 'resumo' | 'repasse' | 'deep';

export type TourLayer =
  | 'api'
  | 'service'
  | 'data'
  | 'ui'
  | 'test'
  | 'util';

// ── Reel: uma ideia por tela (metodologia Reels) ──
// label = kicker curto · title = a conclusão · code = prova real com linhas
// marcadas · visual = opcional (só quando a ideia é melhor vista) · rule =
// regra/porquê com arquivo · sub = legenda · narration = texto falável.
export type ReelVisualKind = 'mermaid' | 'mindmap' | 'html' | 'bubble';

export type ReelCode = {
  readonly file: string; // "src/x.ts:10" (path:linha inicial)
  readonly code: string; // trecho real do arquivo
  readonly mark: readonly number[]; // linhas absolutas destacadas
};

export type ReelVisual = {
  readonly kind: ReelVisualKind;
  readonly title: string;
  readonly content: string;
};

export type ReelRule = {
  readonly file: string | null;
  readonly text: string;
};

export type Reel = {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly code: ReelCode | null;
  readonly visual: ReelVisual | null;
  readonly rule: ReelRule | null;
  readonly sub: string;
  readonly narration: string;
};

export type CodeReel = {
  readonly topic: string;
  readonly goal: string;
  readonly reels: readonly Reel[];
};

// Mapa de bolhas radial (estilo hub-satélite): 1 centro + hubs + folhas.
// O content do visual é JSON stringificado (ver parseBubbleContent).
export type TourBubbleNode = {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly parent: string | null;
  readonly file: string | null;
  readonly reel: string | null;
};

export type TourBubbleContent = {
  readonly center: { readonly label: string; readonly detail: string };
  readonly nodes: readonly TourBubbleNode[];
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
  readonly id: string; // = id do caderno (pendência 1:1)
  readonly projectRoot: string;
  readonly query: string;
  readonly depth: TourDepth;
  readonly artifacts: readonly ArtifactKind[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly reel: CodeReel | null;
  readonly pack: StructurePack | null;
};

// Visão pública (sem o pack completo — ele vai em GET /codetour/structure).
export type PublicSession = {
  readonly id: string;
  readonly projectRoot: string;
  readonly query: string;
  readonly depth: TourDepth;
  readonly artifacts: readonly ArtifactKind[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly reel: CodeReel | null;
  readonly scan: { readonly files: number; readonly truncated: boolean } | null;
  readonly layers: Readonly<Record<string, TourLayer>>;
};
