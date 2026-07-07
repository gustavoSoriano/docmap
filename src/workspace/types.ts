export type WorkspaceRef = {
  root: string | null;
};

export type WorkspaceMeta = {
  readonly path: string;
  readonly name: string;
  readonly lastOpened: string;
};
