import { macrosHandler } from './handler.ts';

const assert: (
  condition: unknown,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const withKv = async (run: (kv: Deno.Kv) => Promise<void>): Promise<void> => {
  const dir = await Deno.makeTempDir({ prefix: 'docmap-macros-' });
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
  headers?: Record<string, string>,
): Promise<Response> => {
  const url = new URL(`http://127.0.0.1:3334${path}`);
  const req = new Request(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return await macrosHandler(kv)(req, url);
};

const jsonBody = async (
  response: Response,
): Promise<Record<string, unknown>> =>
  await response.json() as Record<string, unknown>;

Deno.test('collections organize macros and preserve them when removed', async () => {
  await withKv(async (kv) => {
    const collectionRes = await request(kv, 'POST', '/macros/collections', {
      name: 'Deploy',
    });
    assert(collectionRes.status === 201, 'collection deveria ser criada');
    const collection = await jsonBody(collectionRes);
    const collectionId = String(collection.id);

    const macroRes = await request(kv, 'POST', '/macros', {
      name: 'publicar-app',
      title: 'Publicar app',
      script: '#!/bin/bash\necho ok',
      collectionId,
    });
    assert(macroRes.status === 201, 'macro deveria ser criada');
    const macro = await jsonBody(macroRes);

    const filtered = await request(
      kv,
      'GET',
      `/macros?collectionId=${collectionId}`,
    ).then((response) => response.json()) as Record<string, unknown>[];
    assert(
      filtered.length === 1,
      'filtro deveria retornar a macro da collection',
    );

    const removed = await jsonBody(
      await request(kv, 'DELETE', `/macros/collections/${collectionId}`),
    );
    assert(removed.unassigned === 1, 'macro deveria ser desassociada');

    const preserved = await jsonBody(
      await request(kv, 'GET', `/macros/${String(macro.id)}`),
    );
    assert(
      preserved.collectionId === undefined,
      'macro deveria continuar existindo sem collection',
    );
  });
});

Deno.test('macro references resolve by slug and reject missing or circular calls', async () => {
  await withKv(async (kv) => {
    const created = await jsonBody(
      await request(kv, 'POST', '/macros', {
        name: 'preparar-dados',
        title: 'Preparar dados',
        script: '#!/bin/bash\necho pronto',
      }),
    );
    const macroId = String(created.id);

    const byName = await request(kv, 'GET', '/macros/preparar-dados');
    assert(byName.status === 200, 'slug deveria resolver a macro');

    const missing = await request(kv, 'POST', '/macros/inexistente/invoke');
    assert(missing.status === 404, 'macro ausente deveria retornar 404');
    const missingBody = await jsonBody(missing);
    assert(
      missingBody.error === 'macro_not_found',
      'erro deveria identificar macro ausente',
    );

    const circular = await request(
      kv,
      'POST',
      '/macros/preparar-dados/invoke',
      undefined,
      { 'X-Docmap-Macro-Stack': macroId },
    );
    assert(circular.status === 409, 'ciclo deveria ser rejeitado');
  });
});

Deno.test('macro slugs are unique so composed calls stay deterministic', async () => {
  await withKv(async (kv) => {
    const first = await request(kv, 'POST', '/macros', {
      name: 'build',
      title: 'Build',
      script: '#!/bin/bash\ntrue',
    });
    assert(first.status === 201, 'primeira macro deveria ser criada');

    const duplicate = await request(kv, 'POST', '/macros', {
      name: 'Build',
      title: 'Outro build',
      script: '#!/bin/bash\ntrue',
    });
    assert(duplicate.status === 409, 'slug duplicado deveria ser rejeitado');

    const reserved = await request(kv, 'POST', '/macros', {
      name: 'collections',
      title: 'Nome reservado',
      script: '#!/bin/bash\ntrue',
    });
    assert(reserved.status === 409, 'slug de rota deveria ser reservado');
  });
});

Deno.test('macro input label is saved, listed and can be cleared', async () => {
  await withKv(async (kv) => {
    const created = await jsonBody(
      await request(kv, 'POST', '/macros', {
        name: 'build-param',
        title: 'Build com parâmetro',
        script: '#!/bin/bash\necho "$DOCMAP_INPUT"',
        inputLabel: 'Nome do projeto',
      }),
    );
    assert(
      created.inputLabel === 'Nome do projeto',
      'inputLabel deveria ser salvo',
    );

    const listed = await request(kv, 'GET', '/macros').then((response) =>
      response.json()
    ) as Record<string, unknown>[];
    assert(
      listed[0].inputLabel === 'Nome do projeto',
      'preview deveria incluir inputLabel',
    );

    const updated = await jsonBody(
      await request(kv, 'PUT', `/macros/${String(created.id)}`, {
        inputLabel: null,
      }),
    );
    assert(
      updated.inputLabel === undefined,
      'inputLabel deveria poder ser removido',
    );
  });
});
