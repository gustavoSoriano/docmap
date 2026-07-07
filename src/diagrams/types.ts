export type Diagram = {
  readonly id: string;
  readonly title: string;
  readonly source: string; // sintaxe Mermaid
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type DiagramPreview = Omit<Diagram, 'source'> & { readonly preview: string };

export type CreateDiagramInput = {
  readonly title: string;
  readonly source: string;
};

export type UpdateDiagramInput = Partial<CreateDiagramInput>;
