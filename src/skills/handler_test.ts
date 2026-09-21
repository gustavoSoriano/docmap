import { skillsApiHandler } from './handler.ts';

const assert: (
  condition: unknown,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const withKv = async (run: (kv: Deno.Kv) => Promise<void>): Promise<void> => {
  const dir = await Deno.makeTempDir({ prefix: 'docmap-skills-' });
  const kv = await Deno.openKv(`${dir}/test.sqlite3`);
  try {
    await run(kv);
  } finally {
    kv.close();
    await Deno.remove(dir, { recursive: true });
  }
};

const request = async (
  kv: Deno.Kv,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<Response> => {
  const url = new URL(`http://127.0.0.1:3334${path}`);
  const req = new Request(url, {
    method,
    ...(body
      ? {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
      : {}),
  });
  return await skillsApiHandler(kv)(req, url);
};

const jsonBody = async (
  response: Response,
): Promise<Record<string, unknown>> =>
  await response.json() as Record<string, unknown>;

Deno.test('skills api permits POST and PUT for headless clients', async () => {
  await withKv(async (kv) => {
    const collectionRes = await request(kv, 'POST', '/skills/collections', {
      name: 'Agentes',
    });
    assert(collectionRes.status === 201, 'collection deveria ser criada');
    const collection = await jsonBody(collectionRes);
    const collectionId = String(collection.id);

    const createdRes = await request(kv, 'POST', '/skills', {
      name: 'analisar-pr',
      title: 'Analisar PR',
      content: '# Analisar PR\n\nRevise mudancas com cuidado.',
      tags: ['Code Review'],
      collectionId,
    });
    assert(createdRes.status === 201, 'skill deveria ser criada via API');
    const created = await jsonBody(createdRes);
    assert(created.name === 'analisar-pr', 'slug deveria ser preservado');
    assert(created.description === '', 'description deveria ser opcional');
    assert(
      created.collectionId === collectionId,
      'collectionId deveria ser salvo',
    );

    const updatedRes = await request(kv, 'PUT', '/skills/analisar-pr', {
      title: 'Analisar Pull Request',
      tags: ['Review'],
      collectionId: null,
    });
    assert(updatedRes.status === 200, 'skill deveria ser editada por name');
    const updated = await jsonBody(updatedRes);
    assert(
      updated.title === 'Analisar Pull Request',
      'titulo deveria ser atualizado',
    );
    assert(
      updated.collectionId === undefined,
      'collectionId null deveria remover da collection',
    );
    assert(
      Array.isArray(updated.tags) && updated.tags[0] === 'review',
      'tags deveriam ser normalizadas',
    );
  });
});

Deno.test('skills api permits PUT for collections', async () => {
  await withKv(async (kv) => {
    const created = await jsonBody(
      await request(kv, 'POST', '/skills/collections', { name: 'Antes' }),
    );

    const updatedRes = await request(
      kv,
      'PUT',
      `/skills/collections/${String(created.id)}`,
      { name: 'Depois' },
    );
    assert(updatedRes.status === 200, 'collection deveria ser renomeada');
    const updated = await jsonBody(updatedRes);
    assert(updated.name === 'Depois', 'nome deveria ser atualizado');
  });
});
