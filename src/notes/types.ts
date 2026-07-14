// Categoria é texto livre — o usuário define as próprias.
export type NoteCategory = string;

export type Note = {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly category: NoteCategory;
  readonly docSetId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type NotePreview = Omit<Note, 'content'> & { readonly preview: string };

export type CreateNoteInput = {
  readonly title: string;
  readonly content: string;
  readonly tags?: string[];
  readonly category?: NoteCategory;
  readonly docSetId?: string;
};

export type UpdateNoteInput = Partial<CreateNoteInput>;
