export type ChatStatus = 'open' | 'closed';

export type AuthorKind = 'user' | 'agent' | 'system';

export type Chat = {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly status: ChatStatus;
  readonly lastSeq: number;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ChatMessage = {
  readonly id: string;
  readonly chatId: string;
  readonly seq: number;
  readonly authorKind: AuthorKind;
  readonly authorName: string;
  readonly sessionId?: string;
  readonly to?: string;
  readonly body: string;
  readonly createdAt: string;
};

export type Participant = {
  readonly sessionId: string;
  readonly chatId: string;
  readonly name: string;
  readonly tool?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly presence: 'online' | 'offline';
  readonly lastHeartbeatAt: string;
  readonly joinedAt: string;
  readonly leftAt?: string;
};

export type CreateChatInput = {
  readonly title?: string;
  readonly objective?: string;
  readonly tags?: readonly string[];
};

export type UpdateChatInput = {
  readonly title?: string;
  readonly objective?: string;
  readonly status?: ChatStatus;
  readonly tags?: readonly string[];
};

export type JoinChatInput = {
  readonly name: string;
  readonly tool?: string;
  readonly provider?: string;
  readonly model?: string;
};

export type PostMessageInput = {
  readonly body: string;
  readonly to?: string;
  readonly authorName?: string;
  readonly sessionId?: string;
};
