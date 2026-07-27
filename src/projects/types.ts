export type Project = {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateProjectInput = {
  readonly name: string;
};

export type UpdateProjectInput = {
  readonly name: string;
};
