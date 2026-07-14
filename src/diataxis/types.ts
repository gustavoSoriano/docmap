export type DiataxisType =
  | 'tutorial'
  | 'how-to'
  | 'reference'
  | 'explanation';

export type DiataxisEntityKind =
  | 'file'
  | 'note'
  | 'skill'
  | 'macro'
  | 'diagram'
  | 'task'
  | 'mock'
  | 'favorite';

export type DiataxisDepth = 'quick' | 'complete' | 'deep';

export type DocSetItemRef = {
  readonly kind: DiataxisEntityKind;
  readonly id: string;
};

export type DocSetItemOrigin = 'existing' | 'generated';

export type DocSetItem = {
  readonly type: DiataxisType;
  readonly ref: DocSetItemRef;
  readonly origin: DocSetItemOrigin;
  readonly reason: string;
  readonly userQuestion: string;
  readonly generatedAt?: string;
};

export type DocSet = {
  readonly id: string;
  readonly workspace: string;
  readonly title: string;
  readonly purpose: string;
  readonly audience?: string;
  readonly depth: DiataxisDepth;
  readonly items: readonly DocSetItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type DocSetPreview = Omit<DocSet, 'items'>;

export type CreateDocSetInput = {
  readonly workspace: string;
  readonly title: string;
  readonly purpose: string;
  readonly audience?: string;
  readonly depth?: DiataxisDepth;
  readonly items: readonly DocSetItem[];
};

export type UpdateDocSetInput = {
  readonly title?: string;
  readonly purpose?: string;
  readonly audience?: string | null;
  readonly depth?: DiataxisDepth;
  readonly items?: readonly DocSetItem[];
};

export type DocSetItemView = DocSetItem & {
  readonly exists: boolean;
};

export type DocSetView = Omit<DocSet, 'items'> & {
  readonly items: readonly DocSetItemView[];
};

export type SuggestedItemAction = 'reference' | 'create';

export type SuggestedItem = {
  readonly type: DiataxisType;
  readonly action: SuggestedItemAction;
  readonly ref?: DocSetItemRef;
  readonly entityKind?: DiataxisEntityKind;
  readonly proposedTitle?: string;
  readonly proposedContent?: unknown;
  readonly reason: string;
  readonly userQuestion: string;
};

export type SuggestedDocSet = {
  readonly title: string;
  readonly purpose: string;
  readonly audience?: string;
  readonly depth: DiataxisDepth;
  readonly items: readonly SuggestedItem[];
};

export type SuggestDocSetInput = {
  readonly workspace: string;
  readonly purpose: string;
  readonly audience?: string;
  readonly depth?: DiataxisDepth;
  readonly allowCreation?: boolean;
  readonly useAi?: boolean;
};
