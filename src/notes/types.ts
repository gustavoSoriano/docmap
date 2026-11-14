// Categoria é o id (slug) de uma Category cadastrada em src/categories/.
// String vazia ('') = nota sem categoria.
// Notas antigas com texto livre são migradas para o slug correspondente.
export type NoteCategory = string;

export type Note = {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly category: NoteCategory;
  readonly supersededBy?: string;
  readonly supersededAt?: string;
  readonly obsoleteReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type NotePreview = Omit<Note, 'content'> & { readonly preview: string };

const MAX_REASON = 280;
export const MAX_OBSOLETE_REASON = MAX_REASON;

export type CreateNoteInput = {
  readonly title: string;
  readonly content: string;
  readonly tags?: string[];
  readonly category?: NoteCategory;
  readonly supersededBy?: string;
  readonly obsoleteReason?: string;
};

export type UpdateNoteInput = Partial<CreateNoteInput> & {
  readonly clearSuperseded?: boolean;
};
