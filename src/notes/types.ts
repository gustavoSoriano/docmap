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
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type NotePreview = Omit<Note, 'content'> & { readonly preview: string };

export type CreateNoteInput = {
  readonly title: string;
  readonly content: string;
  readonly tags?: string[];
  readonly category?: NoteCategory;
};

export type UpdateNoteInput = Partial<CreateNoteInput>;
