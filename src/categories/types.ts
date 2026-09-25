// Categoria de nota — cadastro próprio com descrição.
// O `id` é um slug estável; o `name` é o rótulo de exibição.
// A descrição ajuda a IA a entender para que serve cada categoria.
export type Category = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CategoryPreview = Category & { readonly notes: number };

export type CreateCategoryInput = {
  readonly name: string;
  readonly description?: string;
};

export type UpdateCategoryInput = {
  readonly name?: string;
  readonly description?: string;
};
