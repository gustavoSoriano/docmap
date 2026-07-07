export type CommentType = 'note' | 'decision' | 'question' | 'todo' | 'warning';

export type Comment = {
  readonly quote: string;
  readonly note: string;
  readonly type: CommentType;
  readonly updatedAt: string;
};

export type FileComments = {
  readonly fileId: string;
  readonly comments: readonly Comment[];
};

export type UpsertCommentInput = {
  readonly quote: string;
  readonly note: string;
  readonly type: CommentType;
};
