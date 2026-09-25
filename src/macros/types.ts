export type MacroInterpreter = 'bash' | 'deno';
export type MacroLifecycle = 'persistent';

export type MacroCollection = {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type Macro = {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly script: string;
  readonly inputLabel?: string;
  readonly interpreter: MacroInterpreter;
  readonly tags: readonly string[]; // tema/assunto — eixo do grafo
  readonly collectionId?: string;
  readonly lifecycle: MacroLifecycle;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type MacroPreview = Omit<Macro, 'script'>;

export type CreateMacroInput = {
  readonly name: string;
  readonly title: string;
  readonly description?: string;
  readonly script: string;
  readonly inputLabel?: string | null;
  readonly tags?: readonly string[];
  readonly collectionId?: string;
  readonly lifecycle?: MacroLifecycle;
};

export type UpdateMacroInput =
  & Partial<Omit<CreateMacroInput, 'collectionId'>>
  & {
    readonly collectionId?: string | null;
  };

export type CreateMacroCollectionInput = {
  readonly name: string;
};
