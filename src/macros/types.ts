export type MacroInterpreter = 'bash' | 'deno';
export type MacroLifecycle = 'persistent' | 'workflow';

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
  readonly interpreter: MacroInterpreter;
  readonly tags: readonly string[]; // tema/assunto — eixo do grafo
  readonly collectionId?: string;
  readonly lifecycle: MacroLifecycle;
  readonly workflowId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type MacroPreview = Omit<Macro, 'script'>;

export type CreateMacroInput = {
  readonly name: string;
  readonly title: string;
  readonly description?: string;
  readonly script: string;
  readonly tags?: readonly string[];
  readonly collectionId?: string;
  readonly lifecycle?: MacroLifecycle;
  readonly workflowId?: string;
};

export type UpdateMacroInput =
  & Partial<Omit<CreateMacroInput, 'collectionId'>>
  & {
    readonly collectionId?: string | null;
  };

export type CreateMacroCollectionInput = {
  readonly name: string;
};

export type WorkflowMacroArchive = {
  readonly id: string;
  readonly workflowId: string;
  readonly macroId: string;
  readonly name: string;
  readonly title: string;
  readonly interpreter: MacroInterpreter;
  readonly script: string;
  readonly scriptHash: string;
  readonly archivedAt: string;
};
