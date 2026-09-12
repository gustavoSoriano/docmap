import type {
  Chat,
  ChatMessage,
  CreateChatInput,
  JoinChatInput,
  Participant,
  PostMessageInput,
  UpdateChatInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const GLOBAL = '_global_';
const chatKey = (id: string) => ['agentchats', GLOBAL, id] as const;
const CHAT_PREFIX = ['agentchats', GLOBAL] as const;
const msgPrefix = (chatId: string) => ['agentchat_messages', chatId] as const;
const msgKey = (chatId: string, seq: number, id: string) =>
  ['agentchat_messages', chatId, seq, id] as const;
const partKey = (chatId: string, sessionId: string) =>
  ['agentchat_participants', chatId, sessionId] as const;
const partPrefix = (chatId: string) =>
  ['agentchat_participants', chatId] as const;

const STALE_MS = 5 * 60 * 1000;
const MAX_BODY = 8000;
const MAX_NAME = 80;

const nowIso = (): string => new Date().toISOString();

const cleanName = (raw: unknown, fallback: string): string => {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return fallback;
  return s.slice(0, MAX_NAME);
};

const cleanBody = (raw: unknown): string => {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, MAX_BODY);
};

export const listChats = async (
  kv: Deno.Kv,
  tag?: string,
): Promise<Chat[]> => {
  const chats: Chat[] = [];
  for await (const entry of kv.list<Chat>({ prefix: CHAT_PREFIX })) {
    if (entry.value) chats.push(entry.value);
  }
  const filtered = tag
    ? chats.filter((c) => (c.tags ?? []).includes(tag))
    : chats;
  return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getChat = async (
  kv: Deno.Kv,
  id: string,
): Promise<Chat | null> => {
  const entry = await kv.get<Chat>(chatKey(id));
  return entry.value;
};

export const createChat = async (
  kv: Deno.Kv,
  input: CreateChatInput,
): Promise<Chat> => {
  const now = nowIso();
  const chat: Chat = {
    id: crypto.randomUUID(),
    title: cleanName(input.title, 'Chat sem título'),
    objective: typeof input.objective === 'string'
      ? input.objective.trim().slice(0, 4000)
      : '',
    status: 'open',
    lastSeq: 0,
    tags: normalizeTags(input.tags),
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(chatKey(chat.id), chat);
  return chat;
};

export const updateChat = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateChatInput,
): Promise<Chat | null> => {
  const existing = await getChat(kv, id);
  if (!existing) return null;
  const updated: Chat = {
    ...existing,
    title: input.title !== undefined
      ? cleanName(input.title, existing.title)
      : existing.title,
    objective: input.objective !== undefined && typeof input.objective === 'string'
      ? input.objective.trim().slice(0, 4000)
      : existing.objective,
    status: input.status ?? existing.status,
    tags: input.tags !== undefined
      ? normalizeTags(input.tags)
      : (existing.tags ?? []),
    updatedAt: nowIso(),
  };
  await kv.set(chatKey(id), updated);
  return updated;
};

export const deleteChat = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const existing = await getChat(kv, id);
  if (!existing) return false;
  for await (const entry of kv.list({ prefix: msgPrefix(id) })) {
    await kv.delete(entry.key);
  }
  for await (const entry of kv.list({ prefix: partPrefix(id) })) {
    await kv.delete(entry.key);
  }
  await kv.delete(chatKey(id));
  return true;
};

export const listMessages = async (
  kv: Deno.Kv,
  chatId: string,
  opts?: { readonly afterSeq?: number; readonly limit?: number },
): Promise<ChatMessage[]> => {
  const afterSeq = opts?.afterSeq ?? 0;
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 1000);
  const out: ChatMessage[] = [];
  for await (const entry of kv.list<ChatMessage>({ prefix: msgPrefix(chatId) })) {
    const m = entry.value;
    if (!m || m.seq <= afterSeq) continue;
    out.push(m);
  }
  out.sort((a, b) => a.seq - b.seq);
  return out.slice(-limit);
};

const bumpSeq = async (
  kv: Deno.Kv,
  chatId: string,
): Promise<{ readonly chat: Chat; readonly seq: number } | null> => {
  const entry = await kv.get<Chat>(chatKey(chatId));
  const chat = entry.value;
  if (!chat) return null;
  const seq = chat.lastSeq + 1;
  const updated: Chat = { ...chat, lastSeq: seq, updatedAt: nowIso() };
  const res = await kv.atomic()
    .check({ key: chatKey(chatId), versionstamp: entry.versionstamp })
    .set(chatKey(chatId), updated)
    .commit();
  if (!res.ok) return await bumpSeq(kv, chatId);
  return { chat: updated, seq };
};

const insertMessage = async (
  kv: Deno.Kv,
  chatId: string,
  msg: Omit<ChatMessage, 'id' | 'seq' | 'chatId' | 'createdAt'> & {
    readonly body: string;
  },
): Promise<ChatMessage | null> => {
  const bumped = await bumpSeq(kv, chatId);
  if (!bumped) return null;
  const full: ChatMessage = {
    id: crypto.randomUUID(),
    chatId,
    seq: bumped.seq,
    authorKind: msg.authorKind,
    authorName: cleanName(msg.authorName, msg.authorKind),
    ...(msg.sessionId ? { sessionId: msg.sessionId } : {}),
    ...(msg.to ? { to: cleanName(msg.to, '') } : {}),
    body: cleanBody(msg.body),
    createdAt: nowIso(),
  };
  if (!full.body) return null;
  await kv.set(msgKey(chatId, full.seq, full.id), full);
  return full;
};

export const postUserMessage = (
  kv: Deno.Kv,
  chatId: string,
  input: PostMessageInput,
): Promise<ChatMessage | null> =>
  insertMessage(kv, chatId, {
    authorKind: 'user',
    authorName: cleanName(input.authorName, 'Você'),
    ...(input.to ? { to: input.to } : {}),
    body: input.body,
  });

export const postAgentMessage = async (
  kv: Deno.Kv,
  chatId: string,
  sessionId: string,
  input: PostMessageInput,
): Promise<ChatMessage | null> => {
  const part = await getParticipant(kv, chatId, sessionId);
  if (!part || part.presence === 'offline') return null;
  await kv.set(partKey(chatId, sessionId), {
    ...part,
    lastHeartbeatAt: nowIso(),
  });
  return await insertMessage(kv, chatId, {
    authorKind: 'agent',
    authorName: part.name,
    sessionId,
    ...(input.to ? { to: input.to } : {}),
    body: input.body,
  });
};

const postSystemMessage = (
  kv: Deno.Kv,
  chatId: string,
  body: string,
): Promise<ChatMessage | null> =>
  insertMessage(kv, chatId, { authorKind: 'system', authorName: 'Sistema', body });

export const listParticipants = async (
  kv: Deno.Kv,
  chatId: string,
): Promise<Participant[]> => {
  const out: Participant[] = [];
  const now = Date.now();
  for await (
    const entry of kv.list<Participant>({ prefix: partPrefix(chatId) })
  ) {
    const p = entry.value;
    if (!p) continue;
    const stale = now - Date.parse(p.lastHeartbeatAt) > STALE_MS;
    out.push(p.leftAt || stale ? { ...p, presence: 'offline' } : p);
  }
  return out.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
};

export const getParticipant = async (
  kv: Deno.Kv,
  chatId: string,
  sessionId: string,
): Promise<Participant | null> => {
  const entry = await kv.get<Participant>(partKey(chatId, sessionId));
  return entry.value;
};

export const joinChat = async (
  kv: Deno.Kv,
  chatId: string,
  input: JoinChatInput,
): Promise<{ readonly participant: Participant; readonly message: ChatMessage } | null> => {
  const chat = await getChat(kv, chatId);
  if (!chat || chat.status !== 'open') return null;
  const name = cleanName(input.name, '');
  if (!name) return null;
  const now = nowIso();
  const participant: Participant = {
    sessionId: crypto.randomUUID(),
    chatId,
    name,
    ...(input.tool ? { tool: String(input.tool).slice(0, 40) } : {}),
    ...(input.provider ? { provider: String(input.provider).slice(0, 40) } : {}),
    ...(input.model ? { model: String(input.model).slice(0, 80) } : {}),
    presence: 'online',
    lastHeartbeatAt: now,
    joinedAt: now,
  };
  await kv.set(partKey(chatId, participant.sessionId), participant);
  const message = await postSystemMessage(kv, chatId, `${name} entrou na sala.`);
  if (!message) return null;
  return { participant, message };
};

export const leaveChat = async (
  kv: Deno.Kv,
  chatId: string,
  sessionId: string,
): Promise<ChatMessage | null> => {
  const part = await getParticipant(kv, chatId, sessionId);
  if (!part) return null;
  await kv.set(partKey(chatId, sessionId), {
    ...part,
    presence: 'offline',
    leftAt: nowIso(),
  });
  return await postSystemMessage(kv, chatId, `${part.name} saiu da sala.`);
};

export const heartbeat = async (
  kv: Deno.Kv,
  chatId: string,
  sessionId: string,
): Promise<Participant | null> => {
  const part = await getParticipant(kv, chatId, sessionId);
  if (!part || part.leftAt) return null;
  const updated: Participant = {
    ...part,
    presence: 'online',
    lastHeartbeatAt: nowIso(),
  };
  await kv.set(partKey(chatId, sessionId), updated);
  return updated;
};
