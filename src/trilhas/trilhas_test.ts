import { createsCycle } from './dag.ts';
import { createTrilha } from './store.ts';
import {
  claimNode,
  createNode,
  heartbeatNode,
  listNodes,
  normalizeCriteria,
  releaseNode,
  updateNode,
} from './nodes.ts';
import { createEdge, listEdges } from './edges.ts';
import { trilhasHandler } from './handler.ts';

const assert: (
  condition: unknown,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const withKv = async (run: (kv: Deno.Kv) => Promise<void>): Promise<void> => {
  const dir = await Deno.makeTempDir({ prefix: 'docmap-trilhas-' });
  const kv = await Deno.openKv(`${dir}/test.sqlite3`);
  try {
    await run(kv);
  } finally {
    kv.close();
    await Deno.remove(dir, { recursive: true });
  }
};

Deno.test('dag rejeita ciclo direto e indireto', () => {
  assert(createsCycle([], 'a', 'a'), 'self-loop é ciclo');
  assert(
    createsCycle([{ fromNodeId: 'b', toNodeId: 'a' }], 'a', 'b'),
    'ciclo de 2 nós',
  );
  assert(
    createsCycle([
      { fromNodeId: 'a', toNodeId: 'b' },
      { fromNodeId: 'b', toNodeId: 'c' },
    ], 'c', 'a'),
    'ciclo de 3 nós',
  );
  assert(
    !createsCycle([{ fromNodeId: 'a', toNodeId: 'b' }], 'a', 'c'),
    'sem ciclo',
  );
});

Deno.test('trilha cria nós e arestas sem ciclo', async () => {
  await withKv(async (kv) => {
    const trilha = await createTrilha(kv, {
      title: 'Mapear admin',
      objective: 'mapear módulos e contratos',
      tags: ['Admin'],
    });
    assert(trilha.status === 'draft', 'começa como rascunho');
    assert(trilha.tags.includes('admin'), 'tags normalizadas');

    const a = await createNode(kv, trilha.id, { title: 'contexto' }, 0);
    const b = await createNode(
      kv,
      trilha.id,
      { title: 'investigar front', assignee: { kind: 'ai', label: 'codex' } },
      1,
    );
    const ok = await createEdge(
      kv,
      trilha.id,
      a.id,
      b.id,
      async (id) =>
        (await listNodes(kv, trilha.id)).find((n) => n.id === id)?.trilhaId ??
          null,
    );
    assert(ok.edge, 'aresta válida cria');
    const cycle = await createEdge(
      kv,
      trilha.id,
      b.id,
      a.id,
      async (id) =>
        (await listNodes(kv, trilha.id)).find((n) => n.id === id)?.trilhaId ??
          null,
    );
    assert(cycle.error === 'cycle', 'aresta cíclica rejeitada');
    assert((await listEdges(kv, trilha.id)).length === 1, 'só 1 aresta');
  });
});

Deno.test('claim trava o nó e done libera', async () => {
  await withKv(async (kv) => {
    const trilha = await createTrilha(kv, { title: 'T', objective: 'O' });
    const node = await createNode(kv, trilha.id, { title: 'N' }, 0);
    const claimed = await claimNode(kv, node.id, 'codex');
    assert(claimed.node?.claimedBy === 'codex', 'claim registra dono');
    const other = await claimNode(kv, node.id, 'claude');
    assert(other.error === 'claimed', 'segundo dono é recusado');
    const same = await claimNode(kv, node.id, 'codex');
    assert(same.node, 'mesmo dono pode reclamar (idempotente)');
    const blocked = await updateNode(kv, node.id, { status: 'doing' });
    assert(blocked.error === 'claimed', 'PUT sem by em nó travado é 409');
    const wrongBy = await updateNode(kv, node.id, {
      status: 'doing',
      by: 'claude',
    });
    assert(wrongBy.error === 'claimed', 'PUT de outro dono é 409');
    const mine = await updateNode(kv, node.id, {
      status: 'doing',
      by: 'codex',
    });
    assert(mine.node?.status === 'doing', 'dono edita normal');
    const done = await updateNode(kv, node.id, {
      status: 'done',
      by: 'codex',
    });
    assert(
      done.node?.status === 'done' && !done.node?.claimedBy,
      'done libera a trava',
    );
    const node2 = await createNode(kv, trilha.id, { title: 'N2' }, 1);
    await claimNode(kv, node2.id, 'codex');
    const released = await releaseNode(kv, node2.id);
    assert(released && !released.claimedBy, 'release manual limpa a trava');
  });
});

Deno.test('heartbeat e stale funcionam', async () => {
  await withKv(async (kv) => {
    const trilha = await createTrilha(kv, { title: 'T', objective: 'O' });
    const node = await createNode(kv, trilha.id, { title: 'N' }, 0);
    await claimNode(kv, node.id, 'codex');
    const beat = await heartbeatNode(kv, node.id, 'codex');
    assert(beat.node?.lastHeartbeatAt, 'heartbeat registra sinal');
    const other = await heartbeatNode(kv, node.id, 'claude');
    assert(other.error === 'claimed', 'sinal de outro dono é recusado');
    const forced = await claimNode(kv, node.id, 'claude', true);
    assert(
      forced.node?.claimedBy === 'claude',
      'force toma a trava (takeover)',
    );
  });
});

Deno.test('done exige result quando há critérios', async () => {
  await withKv(async (kv) => {
    const trilha = await createTrilha(kv, { title: 'T', objective: 'O' });
    const node = await createNode(
      kv,
      trilha.id,
      { title: 'N', doneCriteria: ['teste passa'] },
      0,
    );
    const noResult = await updateNode(kv, node.id, { status: 'done' });
    assert(
      noResult.error === 'done_needs_result',
      'done sem result é recusado com critérios',
    );
    const plain = await createNode(kv, trilha.id, { title: 'M' }, 1);
    const okPlain = await updateNode(kv, plain.id, { status: 'done' });
    assert(okPlain.node?.status === 'done', 'sem critérios, done passa');
    const withResult = await updateNode(kv, node.id, {
      status: 'done',
      result: 'teste XPTO passou',
    });
    assert(withResult.node?.status === 'done', 'done com result passa');
  });
});

Deno.test('critérios normalizam string e objeto para { id, text, done }', async () => {
  const normalized = normalizeCriteria([
    'teste passa',
    '  ',
    { text: 'sem regressão', done: true },
  ]);
  assert(normalized.length === 2, 'vazios caem fora');
  assert(
    normalized[0].text === 'teste passa' && normalized[0].done === false &&
      typeof normalized[0].id === 'string',
    'string vira objeto pendente com id',
  );
  assert(
    normalized[1].text === 'sem regressão' && normalized[1].done === true,
    'objeto preserva texto e done',
  );
  await withKv(async (kv) => {
    const trilha = await createTrilha(kv, { title: 'T', objective: 'O' });
    const node = await createNode(
      kv,
      trilha.id,
      { title: 'N', doneCriteria: ['a', { text: 'b', done: true }] },
      0,
    );
    assert(node.doneCriteria.length === 2, 'create normaliza');
    assert(node.doneCriteria[1].done === true, 'done persiste no create');
    const toggled = await updateNode(kv, node.id, {
      doneCriteria: node.doneCriteria.map((c) =>
        c.text === 'a' ? { ...c, done: true } : c
      ),
    });
    assert(
      toggled.node?.doneCriteria.every((c) => c.done) === true,
      'update alterna done preservando id e texto',
    );
  });
});

Deno.test('handler expõe CRUD completo via HTTP', async () => {
  await withKv(async (kv) => {
    const handler = trilhasHandler(kv);
    const call = async (
      method: string,
      path: string,
      body?: unknown,
    ): Promise<{ status: number; data: unknown }> => {
      const url = new URL(`http://127.0.0.1:3333${path}`);
      const res = await handler(
        new Request(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        }),
        url,
      );
      const text = await res.text();
      let data: unknown = text;
      try {
        data = JSON.parse(text);
      } catch {
        // erro em texto puro (badRequest) — mantém como string
      }
      return { status: res.status, data };
    };
    const created = await call('POST', '/trilhas', {
      title: 'T',
      objective: 'O',
    });
    assert(created.status === 201, 'cria trilha');
    const id = (created.data as { id: string }).id;
    const node = await call('POST', `/trilhas/${id}/nodes`, {
      title: 'N1',
      dependsOn: [],
    });
    assert(node.status === 201, 'cria nó');
    const nodeId = (node.data as { id: string }).id;
    const single = await call('GET', `/trilhas/${id}/nodes/${nodeId}`);
    assert(single.status === 200, 'lê nó avulso (copiar ID)');
    const bad = await call('PUT', `/trilhas/${id}/nodes/${nodeId}`, {
      status: 'x',
    });
    assert(bad.status === 400, 'status inválido rejeitado');
    const upd = await call('PUT', `/trilhas/${id}/nodes/${nodeId}`, {
      status: 'doing',
      details: 'investigando',
    });
    assert(
      (upd.data as { status: string }).status === 'doing',
      'atualiza nó',
    );
    const claim = await call(
      'POST',
      `/trilhas/${id}/nodes/${nodeId}/claim`,
      { by: 'codex' },
    );
    assert(claim.status === 200, 'claim via HTTP');
    const stolen = await call('PUT', `/trilhas/${id}/nodes/${nodeId}`, {
      status: 'done',
      by: 'claude',
    });
    assert(stolen.status === 409, 'outro dono é recusado via HTTP');
    const rel = await call(
      'POST',
      `/trilhas/${id}/nodes/${nodeId}/release`,
    );
    assert(rel.status === 200, 'release manual via HTTP');
    const rep = await call('PUT', `/trilhas/${id}/nodes/${nodeId}`, {
      result: 'feito: relatório separado do briefing',
    });
    assert(
      (rep.data as { result: string }).result.includes('relatório') &&
        (rep.data as { details: string }).details === 'investigando',
      'result vai em campo próprio sem tocar details',
    );
    const detail = await call('GET', `/trilhas/${id}`);
    assert(
      ((detail.data as { nodes: unknown[] }).nodes ?? []).length === 1,
      'detalhe traz nós',
    );
  });
});

Deno.test('next entrega pronto e reserva; events audita', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'docmap-trilhas-next-' });
  const kv = await Deno.openKv(`${dir}/test.sqlite3`);
  try {
    const handler = trilhasHandler(kv);
    const call = async (
      method: string,
      path: string,
      body?: unknown,
    ): Promise<{ status: number; data: Record<string, unknown> }> => {
      const url = new URL(`http://127.0.0.1:3333${path}`);
      const res = await handler(
        new Request(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        }),
        url,
      );
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        // texto puro
      }
      return { status: res.status, data };
    };
    const t = await call('POST', '/trilhas', { title: 'T', objective: 'O' });
    const id = t.data.id as string;
    const nid = (r: { data: Record<string, unknown> }): string =>
      r.data.id as string;
    const nodeOf = (r: { data: Record<string, unknown> }) =>
      r.data.node as Record<string, unknown>;
    const a = await call('POST', `/trilhas/${id}/nodes`, { title: 'A' });
    const b = await call('POST', `/trilhas/${id}/nodes`, {
      title: 'B',
      dependsOn: [nid(a)],
    });
    assert(b.status === 201, 'B criado com depende de A');
    const peek = await call('GET', `/trilhas/${id}/next`);
    assert(
      peek.status === 200 && (nodeOf(peek).id as string) === nid(a) &&
        peek.data.claimed === false,
      'next sem by só espreita o primeiro pronto',
    );
    const n1 = await call('GET', `/trilhas/${id}/next?by=codex`);
    assert(
      n1.status === 200 && n1.data.claimed === true &&
        (nodeOf(n1).claimedBy as string) === 'codex',
      'next com by reserva',
    );
    const n2 = await call('GET', `/trilhas/${id}/next?by=claude`);
    assert(
      n2.status === 404,
      'outro agente não recebe nó travado nem bloqueado',
    );
    const done = await call('PUT', `/trilhas/${id}/nodes/${nid(a)}`, {
      status: 'done',
      result: 'ok',
      by: 'codex',
    });
    assert(done.status === 200, 'dono conclui');
    const n3 = await call('GET', `/trilhas/${id}/next?by=claude`);
    assert(
      n3.status === 200 && (nodeOf(n3).id as string) === nid(b),
      'liberou B após A pronto',
    );
    const stalePut = await call('PUT', `/trilhas/${id}/nodes/${nid(b)}`, {
      status: 'doing',
      by: 'claude',
      expectedUpdatedAt: '2000-01-01T00:00:00.000Z',
    });
    assert(stalePut.status === 409, 'concorrência otimista recusa');
    const ev = await call('GET', `/trilhas/${id}/events`);
    const types = (ev.data as unknown as Array<{ type: string }>).map((e) =>
      e.type
    );
    for (const want of ['node.created', 'node.claim', 'node.status']) {
      assert(types.includes(want), `events contém ${want}`);
    }
  } finally {
    kv.close();
    await Deno.remove(dir, { recursive: true });
  }
});
