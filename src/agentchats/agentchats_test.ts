import { agentChatsHandler } from './handler.ts';

const assert: (condition: unknown, message: string) => asserts condition = (
  condition,
  message,
) => {
  if (!condition) throw new Error(message);
};

const assertEquals = (a: unknown, b: unknown): void => {
  if (a !== b) throw new Error(`assertEquals falhou: ${a} !== ${b}`);
};

const withHandler = async (fn: (kv: Deno.Kv) => Promise<void>): Promise<void> => {
  const dir = await Deno.makeTempDir({ prefix: 'docmap-agentchats-' });
  const kv = await Deno.openKv(`${dir}/test.sqlite3`);
  try {
    await fn(kv);
  } finally {
    kv.close();
    await Deno.remove(dir, { recursive: true });
  }
};

const jsonBody = async (res: Response): Promise<Record<string, unknown>> =>
  await res.json() as Record<string, unknown>;

const request = (
  kv: Deno.Kv,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> => {
  const handler = agentChatsHandler(kv);
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return handler(new Request(`http://127.0.0.1${path}`, init), new URL(`http://127.0.0.1${path}`));
};

Deno.test('agentchats: cria sala, join, mensagem e inbox bloqueante', async () => {
  await withHandler(async (kv) => {
    const created = await request(kv, 'POST', '/agentchats', {
      title: 'Sala teste',
      objective: 'Organizar tarefas',
      tags: ['API', 'backend '],
    });
    assertEquals(created.status, 201);
    const chat = await jsonBody(created) as { id: string; tags: string[] };
    assert(chat.id, 'chat.id vazio');
    assert(chat.tags.includes('api'), 'tags não normalizadas');

    const joined = await request(kv, 'POST', `/agentchats/${chat.id}/join`, {
      name: 'agente-1',
      tool: 'opencode',
    });
    assertEquals(joined.status, 201);
    const joinData = await jsonBody(joined) as {
      participant: { sessionId: string };
      message: { seq: number };
    };
    const sessionId = joinData.participant.sessionId;
    assert(sessionId, 'sessionId vazio');

    const sent = await request(kv, 'POST', `/agentchats/${chat.id}/messages`, {
      sessionId,
      body: 'Eu assumo a primeira parte',
    });
    assertEquals(sent.status, 201);

    const inbox = await request(
      kv,
      'GET',
      `/agentchats/${chat.id}/inbox?sessionId=${sessionId}&afterSeq=0`,
    );
    assertEquals(inbox.status, 200);
    const inboxData = await jsonBody(inbox) as {
      messages: unknown[];
      lastSeq: number;
    };
    assert(inboxData.messages.length >= 2, 'esperava 2+ mensagens');
    assert(inboxData.lastSeq >= 2, 'esperava lastSeq >= 2');

    const blocking = request(
      kv,
      'GET',
      `/agentchats/${chat.id}/inbox?sessionId=${sessionId}&afterSeq=${inboxData.lastSeq}&wait=2`,
    );
    const userMsg = await request(kv, 'POST', `/agentchats/${chat.id}/messages`, {
      body: 'Vamos lá, time!',
      authorName: 'Você',
    });
    assertEquals(userMsg.status, 201);
    const woken = await blocking;
    assertEquals(woken.status, 200);
    const wokenData = await jsonBody(woken) as {
      messages: Array<{ body: string }>;
      wait: { reason: string; trigger: string };
    };
    assertEquals(wokenData.wait.reason, 'actionable');
    assert(
      wokenData.messages.some((m) => m.body.includes('Vamos lá')),
      'inbox bloqueante não acordou com mensagem nova',
    );

    const prompt = await request(kv, 'GET', `/agentchats/${chat.id}/prompt`);
    assertEquals(prompt.status, 200);
    const text = await prompt.text();
    assert(
      text.includes('Você é um agente do chat Docmap.'),
      'prompt sem marcador de papel',
    );
    assert(
      text.includes('PROIBIDO começar qualquer tarefa antes de combinar'),
      'prompt sem trava de coordenação',
    );
    assert(text.includes('ASSUMO:'), 'prompt sem protocolo de claim');
    assert(
      text.includes('Progresso contínuo'),
      'prompt sem regra de atualização contínua',
    );
    assert(
      text.includes('ÚNICO canal'),
      'prompt sem trava de canal único',
    );
    assert(
      text.includes('hyperfocus'),
      'prompt sem formato hyperfocus padrão',
    );
  });
});
