import { getChat, listMessages, listParticipants } from './store.ts';
import {
  getChatEventRevision,
  waitForChatEvent,
} from './events.ts';

export type InboxWaitMeta = {
  readonly mode: 'long_poll';
  readonly reason: 'actionable' | 'timeout' | 'aborted';
  readonly trigger: 'initial' | 'event' | 'timeout' | 'abort';
  readonly waitedMs: number;
  readonly timeoutSeconds: number;
};

const relevantForChat = (chatId: string) =>
  (event: { readonly type: string; readonly chatId: string }): boolean => {
    if (event.chatId !== chatId) return false;
    return event.type !== 'chat.typing';
  };

export const getChatInboxWithWait = async (
  kv: Deno.Kv,
  chatId: string,
  afterSeq: number,
  waitMs: number,
  signal: AbortSignal,
): Promise<{
  readonly chat: unknown;
  readonly messages: unknown;
  readonly participants: unknown;
  readonly lastSeq: number;
  readonly revision: number;
  readonly wait: InboxWaitMeta;
} | null> => {
  const startedAt = Date.now();
  const deadline = startedAt + waitMs;
  let revision = getChatEventRevision();
  const base = (wait: InboxWaitMeta, rev: number) => ({ wait, revision: rev });

  const snapshot = async () => {
    const chat = await getChat(kv, chatId);
    if (!chat) return null;
    const messages = await listMessages(kv, chatId, { afterSeq });
    const participants = await listParticipants(kv, chatId);
    return { chat, messages, participants, lastSeq: chat.lastSeq };
  };

  const first = await snapshot();
  if (!first) return null;
  if (first.lastSeq > afterSeq || first.messages.length > 0) {
    return {
      ...first,
      ...base({
        mode: 'long_poll',
        reason: 'actionable',
        trigger: 'initial',
        waitedMs: Date.now() - startedAt,
        timeoutSeconds: waitMs / 1000,
      }, revision),
    };
  }

  while (Date.now() < deadline) {
    const eventResult = await waitForChatEvent({
      afterRevision: revision,
      timeoutMs: deadline - Date.now(),
      signal,
      predicate: relevantForChat(chatId),
    });
    revision = eventResult.revision;
    const current = await snapshot();
    if (!current) return null;
    if (current.lastSeq > afterSeq || current.messages.length > 0) {
      return {
        ...current,
        ...base({
          mode: 'long_poll',
          reason: 'actionable',
          trigger: 'event',
          waitedMs: Date.now() - startedAt,
          timeoutSeconds: waitMs / 1000,
        }, revision),
      };
    }
    if (eventResult.reason !== 'event') {
      return {
        ...current,
        ...base({
          mode: 'long_poll',
          reason: eventResult.reason,
          trigger: eventResult.reason === 'aborted' ? 'abort' : 'timeout',
          waitedMs: Date.now() - startedAt,
          timeoutSeconds: waitMs / 1000,
        }, revision),
      };
    }
  }

  const last = await snapshot();
  if (!last) return null;
  return {
    ...last,
    ...base({
      mode: 'long_poll',
      reason: 'timeout',
      trigger: 'timeout',
      waitedMs: Date.now() - startedAt,
      timeoutSeconds: waitMs / 1000,
    }, revision),
  };
};
