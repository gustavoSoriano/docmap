export type MacroInterpreter = 'bash' | 'deno';

export type Macro = {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly script: string;
  readonly interpreter: MacroInterpreter;
  readonly tags: readonly string[]; // tema/assunto — eixo do grafo
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
};

export type UpdateMacroInput = Partial<CreateMacroInput>;
