import {
  broadcastChatEvent,
  getChatEventRevision,
  subscribeChatEvents,
} from './events.ts';
import { getChatInboxWithWait } from './inbox.ts';
import { buildAgentChatPrompt } from './prompts.ts';
import {
  createChat,
  deleteChat,
  getChat,
  getParticipant,
  heartbeat,
  joinChat,
  leaveChat,
  listChats,
  listMessages,
  listParticipants,
  postAgentMessage,
  postUserMessage,
  updateChat,
} from './store.ts';
import { badRequest, json, notFound } from '../server/response.ts';

const MAX_WAIT_SECONDS = 600;
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

const textResponse = (body: string): Response =>
  new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });

const readJson = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return null;
  }
};

const parseWaitMs = (url: URL): number | null => {
  if (!url.searchParams.has('wait')) return null;
  const seconds = Number(url.searchParams.get('wait'));
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error('wait deve ser um número positivo de segundos');
  }
  return Math.min(seconds, MAX_WAIT_SECONDS) * 1000;
};

const parseAfterSeq = (url: URL): number => {
  const raw = Number(url.searchParams.get('afterSeq') ?? '0');
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.floor(raw);
};

const validId = (id: string): boolean => ID_RE.test(id);

export const agentChatsHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/agentchats\/?/, '').split('/')
      .filter(Boolean);

    try {
      if (req.method === 'GET' && segments[0] === 'events') {
        return new Response(subscribeChatEvents(), {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      if (req.method === 'GET' && segments.length === 0) {
        const tag = url.searchParams.get('tag') ?? undefined;
        return json(await listChats(kv, tag));
      }

      if (req.method === 'POST' && segments.length === 0) {
        const body = await readJson(req) as {
          title?: string;
          objective?: string;
          tags?: unknown;
        } | null;
        const chat = await createChat(kv, {
          ...(body?.title !== undefined ? { title: body.title } : {}),
          ...(body?.objective !== undefined
            ? { objective: body.objective }
            : {}),
          ...(Array.isArray(body?.tags)
            ? { tags: body.tags as string[] }
            : {}),
        });
        broadcastChatEvent({
          id: crypto.randomUUID(),
          type: 'chat.updated',
          chatId: chat.id,
          payload: { chat },
          createdAt: new Date().toISOString(),
        });
        return json(chat, 201);
      }

      const id = segments[0];
      if (!id || !validId(id)) return notFound();

      if (req.method === 'GET' && segments.length === 1) {
        const chat = await getChat(kv, id);
        if (!chat) return notFound();
        const afterSeq = parseAfterSeq(url);
        const limit = Number(url.searchParams.get('limit') ?? '200');
        return json({
          chat,
          messages: await listMessages(kv, id, { afterSeq, limit }),
          participants: await listParticipants(kv, id),
          revision: getChatEventRevision(),
        });
      }

      if (req.method === 'PUT' && segments.length === 1) {
        const body = await readJson(req) as {
          title?: string;
          objective?: string;
          status?: 'open' | 'closed';
          tags?: unknown;
        } | null;
        if (!body || typeof body !== 'object') return badRequest('Invalid JSON');
        const updated = await updateChat(kv, id, {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.objective !== undefined ? { objective: body.objective } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(Array.isArray(body.tags) ? { tags: body.tags as string[] } : {}),
        });
        if (!updated) return notFound();
        broadcastChatEvent({
          id: crypto.randomUUID(),
          type: 'chat.updated',
          chatId: id,
          payload: { chat: updated },
          createdAt: new Date().toISOString(),
        });
        return json(updated);
      }

      if (req.method === 'DELETE' && segments.length === 1) {
        const ok = await deleteChat(kv, id);
        if (!ok) return notFound();
        broadcastChatEvent({
          id: crypto.randomUUID(),
          type: 'chat.deleted',
          chatId: id,
          payload: {},
          createdAt: new Date().toISOString(),
        });
        return json({ ok: true });
      }

      if (req.method === 'GET' && segments[1] === 'prompt') {
        const chat = await getChat(kv, id);
        if (!chat) return notFound();
        return textResponse(buildAgentChatPrompt(chat));
      }

      if (req.method === 'GET' && segments[1] === 'messages') {
        const chat = await getChat(kv, id);
        if (!chat) return notFound();
        const afterSeq = parseAfterSeq(url);
        const limit = Number(url.searchParams.get('limit') ?? '200');
        return json({
          messages: await listMessages(kv, id, { afterSeq, limit }),
          lastSeq: chat.lastSeq,
          revision: getChatEventRevision(),
        });
      }

      if (req.method === 'POST' && segments[1] === 'messages') {
        const body = await readJson(req) as {
          body?: unknown;
          to?: unknown;
          sessionId?: unknown;
          authorName?: unknown;
        } | null;
        if (!body || typeof body !== 'object') return badRequest('Invalid JSON');
        if (typeof body.body !== 'string' || !body.body.trim()) {
          return badRequest('body required');
        }
        const to = typeof body.to === 'string' ? body.to : undefined;
        if (typeof body.sessionId === 'string' && body.sessionId) {
          if (!validId(body.sessionId)) return badRequest('sessionId inválido');
          const message = await postAgentMessage(kv, id, body.sessionId, {
            body: body.body,
            ...(to ? { to } : {}),
          });
          if (!message) return badRequest('sessão inválida ou sala fechada');
          broadcastChatEvent({
            id: crypto.randomUUID(),
            type: 'chat.message',
            chatId: id,
            payload: { message },
            createdAt: new Date().toISOString(),
          });
          return json(message, 201);
        }
        const message = await postUserMessage(kv, id, {
          body: body.body,
          ...(to ? { to } : {}),
          ...(typeof body.authorName === 'string'
            ? { authorName: body.authorName }
            : {}),
        });
        if (!message) return notFound();
        broadcastChatEvent({
          id: crypto.randomUUID(),
          type: 'chat.message',
          chatId: id,
          payload: { message },
          createdAt: new Date().toISOString(),
        });
        return json(message, 201);
      }

      if (req.method === 'POST' && segments[1] === 'join') {
        const body = await readJson(req) as {
          name?: unknown;
          tool?: unknown;
          provider?: unknown;
          model?: unknown;
        } | null;
        if (!body || typeof body !== 'object') return badRequest('Invalid JSON');
        if (typeof body.name !== 'string' || !body.name.trim()) {
          return badRequest('name required');
        }
        const joined = await joinChat(kv, id, {
          name: body.name,
          ...(typeof body.tool === 'string' ? { tool: body.tool } : {}),
          ...(typeof body.provider === 'string'
            ? { provider: body.provider }
            : {}),
          ...(typeof body.model === 'string' ? { model: body.model } : {}),
        });
        if (!joined) return badRequest('sala inválida ou fechada');
        broadcastChatEvent({
          id: crypto.randomUUID(),
          type: 'chat.join',
          chatId: id,
          payload: {
            participant: joined.participant,
            message: joined.message,
          },
          createdAt: new Date().toISOString(),
        });
        return json({
          ...joined,
          inboxUrl:
            `/agentchats/${id}/inbox?sessionId=${joined.participant.sessionId}&afterSeq=0`,
          blockingInboxUrl:
            `/agentchats/${id}/inbox?sessionId=${joined.participant.sessionId}&afterSeq=0&wait=600`,
          messagesUrl: `/agentchats/${id}/messages`,
          heartbeatUrl: `/agentchats/${id}/heartbeat`,
          promptUrl: `/agentchats/${id}/prompt`,
        }, 201);
      }

      if (req.method === 'POST' && segments[1] === 'leave') {
        const body = await readJson(req) as { sessionId?: unknown } | null;
        const sessionId = typeof body?.sessionId === 'string'
          ? body.sessionId
          : url.searchParams.get('sessionId') ?? '';
        if (!sessionId || !validId(sessionId)) {
          return badRequest('sessionId required');
        }
        const message = await leaveChat(kv, id, sessionId);
        if (!message) return notFound();
        broadcastChatEvent({
          id: crypto.randomUUID(),
          type: 'chat.leave',
          chatId: id,
          payload: { sessionId, message },
          createdAt: new Date().toISOString(),
        });
        return json({ ok: true, message });
      }

      if (req.method === 'POST' && segments[1] === 'heartbeat') {
        const body = await readJson(req) as { sessionId?: unknown } | null;
        const sessionId = typeof body?.sessionId === 'string'
          ? body.sessionId
          : url.searchParams.get('sessionId') ?? '';
        if (!sessionId) return badRequest('sessionId required');
        const part = await getParticipant(kv, id, sessionId);
        if (!part) return notFound();
        const updated = await heartbeat(kv, id, sessionId);
        return json({ ok: true, participant: updated });
      }

      if (req.method === 'POST' && segments[1] === 'typing') {
        const body = await readJson(req) as { sessionId?: unknown } | null;
        const sessionId = typeof body?.sessionId === 'string'
          ? body.sessionId
          : '';
        broadcastChatEvent({
          id: crypto.randomUUID(),
          type: 'chat.typing',
          chatId: id,
          payload: { sessionId },
          createdAt: new Date().toISOString(),
        });
        return json({ ok: true });
      }

      if (req.method === 'GET' && segments[1] === 'inbox') {
        const sessionId = url.searchParams.get('sessionId') ?? '';
        const afterSeq = parseAfterSeq(url);
        const waitMs = parseWaitMs(url);
        const chat = await getChat(kv, id);
        if (!chat) return notFound();
        if (sessionId) {
          const part = await getParticipant(kv, id, sessionId);
          if (part) await heartbeat(kv, id, sessionId);
        }
        if (waitMs === null) {
          return json({
            chat,
            messages: await listMessages(kv, id, { afterSeq }),
            participants: await listParticipants(kv, id),
            lastSeq: chat.lastSeq,
            revision: getChatEventRevision(),
          });
        }
        const result = await getChatInboxWithWait(
          kv,
          id,
          afterSeq,
          waitMs,
          req.signal,
        );
        if (!result) return notFound();
        return json(result);
      }

      return json({ error: 'method_not_allowed' }, 405);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'erro interno';
      if (message.includes('wait deve ser')) return badRequest(message);
      console.error('agentchats handler:', err);
      return json({ error: 'internal_error', message }, 500);
    }
  };
