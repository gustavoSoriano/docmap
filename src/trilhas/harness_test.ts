import { createTrilha } from './store.ts';
import { createNode, listNodes } from './nodes.ts';
import { createEdge, listEdges } from './edges.ts';
import { buildAttention, buildHealth } from './attention.ts';
import { autoLayout, LAYOUT } from './layout.ts';
import { trilhasHandler } from './handler.ts';
import { createNote } from '../notes/store.ts';
import { createSkill } from '../skills/store.ts';
import type { TrilhaNode } from './types.ts';

const assert: (
  condition: unknown,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

type Json = Record<string, unknown>;

const withApi = async (
  run: (call: Call, kv: Deno.Kv) => Promise<void>,
): Promise<void> => {
  const dir = await Deno.makeTempDir({ prefix: 'docmap-harness-' });
  const kv = await Deno.openKv(`${dir}/test.sqlite3`);
  try {
    const handler = trilhasHandler(kv);
    const call: Call = async (method, path, body) => {
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
      } catch { /* texto puro (markdown) */ }
      return { status: res.status, data, text };
    };
    await run(call, kv);
  } finally {
    kv.close();
    await Deno.remove(dir, { recursive: true });
  }
};

type Call = (
  method: string,
  path: string,
  body?: unknown,
) => Promise<{ status: number; data: unknown; text: string }>;

const setup = async (call: Call) => {
  const t = await call('POST', '/trilhas', {
    title: 'T',
    objective: 'O',
    tags: ['focal'],
  });
  const id = (t.data as Json).id as string;
  const a = await call('POST', `/trilhas/${id}/nodes`, {
    title: 'A',
    group: 'app-x',
  });
  const b = await call('POST', `/trilhas/${id}/nodes`, {
    title: 'B',
    group: 'app-x',
    dependsOn: [(a.data as Json).id],
  });
  return {
    id,
    a: (a.data as Json).id as string,
    b: (b.data as Json).id as string,
  };
};

Deno.test('sinal blocker bloqueia o bloco e resolver o libera', async () => {
  await withApi(async (call) => {
    const { id, a } = await setup(call);
    const s = await call('POST', `/trilhas/${id}/signals`, {
      kind: 'blocker',
      text: 'sem acesso ao staging',
      nodeId: a,
      by: 'codex',
    });
    assert(s.status === 201, 'sinal criado');
    let detail = (await call('GET', `/trilhas/${id}`)).data as Json;
    const nodeA = (detail.nodes as TrilhaNode[]).find((n) => n.id === a);
    assert(nodeA?.status === 'blocked', 'bloco ficou bloqueado');
    assert(nodeA?.blockedReason === 'sem acesso ao staging', 'motivo copiado');
    const att = detail.attention as Array<{ kind: string; source: string }>;
    assert(
      att.length === 1 && att[0].kind === 'blocker' &&
        att[0].source === 'signal',
      'fila tem 1 bloqueio sem duplicar',
    );
    const sid = (s.data as Json).id as string;
    const r = await call('PUT', `/trilhas/${id}/signals/${sid}`, {
      resolution: 'liberado',
      by: 'gustavo',
    });
    assert(r.status === 200, 'resolve');
    detail = (await call('GET', `/trilhas/${id}`)).data as Json;
    const after = (detail.nodes as TrilhaNode[]).find((n) => n.id === a);
    assert(
      after?.status === 'todo' && !after.blockedReason,
      'bloco voltou a todo',
    );
    assert((detail.attention as unknown[]).length === 0, 'fila vazia');
    const bad = await call('POST', `/trilhas/${id}/signals`, {
      kind: 'xx',
      text: 'y',
    });
    assert(bad.status === 400, 'kind inválido recusado');
  });
});

Deno.test('refs resolvem do acervo, deduplicam e sinalizam alvo removido', async () => {
  await withApi(async (call, kv) => {
    const { id, a } = await setup(call);
    await createNote(kv, {
      title: 'Regra de ouro',
      content: 'Nunca faça merge sem revisão.',
      tags: ['focal', 'i-guardrail'],
    });
    const skill = await createSkill(kv, {
      name: 'deploy',
      title: 'Deploy',
      content: '# x',
      tags: ['focal'],
    });
    const r1 = await call('POST', `/trilhas/${id}/refs`, {
      kind: 'skill',
      targetId: skill.id,
      nodeId: a,
    });
    assert(
      r1.status === 201 && (r1.data as Json).title === 'Deploy',
      'ref criada e resolvida',
    );
    const r2 = await call('POST', `/trilhas/${id}/refs`, {
      kind: 'skill',
      targetId: skill.id,
      nodeId: a,
    });
    assert(r2.status === 200, 'duplicata não cria outra');
    const bad = await call('POST', `/trilhas/${id}/refs`, {
      kind: 'note',
      targetId: 'nope',
    });
    assert(bad.status === 400, 'alvo inexistente recusado');
    const arsenal = (await call('GET', `/trilhas/${id}/arsenal`))
      .data as Record<string, Json[]>;
    assert(
      arsenal.guardrails.length === 1 && arsenal.guardrails[0].via === 'tag',
      'guardrail por tag já vale (ativo sem fixar)',
    );
    assert(
      arsenal.skills.length === 0 && arsenal.notes.length === 0,
      'sem busca nada do acervo é listado de graça',
    );
    const pin = await call('POST', `/trilhas/${id}/refs`, {
      kind: 'skill',
      targetId: skill.id,
    });
    assert(pin.status === 201, 'fixar na trilha');
    const again = (await call('GET', `/trilhas/${id}/arsenal`))
      .data as Record<string, Json[]>;
    assert(
      again.skills.length === 1 && again.skills[0].pinned === true,
      'fixada aparece sem busca',
    );
    const found = (await call('GET', `/trilhas/${id}/arsenal?q=regra`))
      .data as Record<string, Json[]>;
    assert(found.guardrails.length === 1, 'busca acha por título');
    assert(found.skills.length === 0, 'busca só devolve o que casa');
    const byTag = (await call('GET', `/trilhas/${id}/arsenal?q=focal`))
      .data as Record<string, Json[]>;
    assert(byTag.skills.length === 1, 'busca também casa por tag');
    const hash = (await call(
      'GET',
      `/trilhas/${id}/arsenal?q=${encodeURIComponent('#Focal')}`,
    ))
      .data as Record<string, Json[]>;
    assert(hash.skills.length === 1, '#tag e caixa alta casam');
    const spaced = (await call(
      'GET',
      `/trilhas/${id}/arsenal?q=${encodeURIComponent('i guardrail')}`,
    ))
      .data as Record<string, Json[]>;
    assert(spaced.guardrails.length === 1, 'tag com espaço casa a forma-slug');
    await kv.delete(['skills', '_global_', skill.id]);
    const detail = (await call('GET', `/trilhas/${id}`)).data as Json;
    const missing = (detail.refs as Json[]).filter((r) => r.missing === true);
    assert(missing.length === 2, 'refs órfãs marcadas como missing');
  });
});

Deno.test('atenção: stale, vez do humano e ordem por gravidade', async () => {
  await withApi(async (call, kv) => {
    const { id } = await setup(call);
    const human = await call('POST', `/trilhas/${id}/nodes`, {
      title: 'Revisão do Gustavo',
      assignee: { kind: 'human', label: 'Gustavo' },
    });
    await call('POST', `/trilhas/${id}/signals`, {
      kind: 'warning',
      text: 'PR grande',
      by: 'ia',
    });
    await call('POST', `/trilhas/${id}/signals`, {
      kind: 'question',
      text: 'qual versão?',
      by: 'ia',
    });
    const nodes = await listNodes(kv, id);
    const stale = {
      ...nodes[0],
      claimedBy: 'agente',
      claimedAt: '2000-01-01T00:00:00.000Z',
      status: 'doing' as const,
    };
    const edges = await listEdges(kv, id);
    const signals = (await call('GET', `/trilhas/${id}/signals`))
      .data as never[];
    const items = buildAttention([stale, ...nodes.slice(1)], edges, signals);
    const kinds = items.map((i) => i.kind);
    assert(
      kinds.join() === 'question,pending,warning,stale',
      `ordem: ${kinds.join()}`,
    );
    assert(
      items.some((i) => i.nodeId === (human.data as Json).id),
      'vez do humano aparece',
    );
    const health = buildHealth(
      [stale, ...nodes.slice(1)],
      edges,
      signals,
      items,
    );
    assert(
      health.stale === 1 && health.waitingHuman === 2 &&
        health.activeAgents.length === 0,
      'saúde coerente',
    );
  });
});

Deno.test('layout agrupa por frente e respeita ordem topológica', async () => {
  await withApi(async (call, kv) => {
    const { id, a, b } = await setup(call);
    const c = await call('POST', `/trilhas/${id}/nodes`, {
      title: 'C',
      group: 'app-y',
    });
    const r = await call('POST', `/trilhas/${id}/layout`);
    assert(r.status === 200 && (r.data as Json).moved === 3, 'moveu 3 blocos');
    const nodes = await listNodes(kv, id);
    const pos = (nid: string) => nodes.find((n) => n.id === nid)!.position;
    assert(
      pos(a).x === pos(b).x && pos(b).y > pos(a).y,
      'A acima de B na mesma coluna',
    );
    assert(
      pos((c.data as Json).id as string).x ===
        pos(a).x + LAYOUT.nodeW + LAYOUT.gapX,
      'outra frente, outra coluna',
    );
    const pure = autoLayout(nodes, await listEdges(kv, id));
    assert(pure.size === 3, 'função pura cobre todos');
  });
});

Deno.test('pacote de contexto traz guardrail, briefing e dependências', async () => {
  await withApi(async (call, kv) => {
    const { id, a, b } = await setup(call);
    await createNote(kv, {
      title: 'Regra de ouro',
      content: 'Nunca faça merge sem revisão.',
      tags: ['focal', 'i-guardrail'],
    });
    await call('PUT', `/trilhas/${id}/nodes/${a}`, {
      result: 'feito o A',
      status: 'done',
      by: 'x',
    });
    await call('PUT', `/trilhas/${id}/nodes/${b}`, { details: 'faça o B' });
    const ctx = await call('GET', `/trilhas/${id}/context?node=${b}`);
    assert(ctx.status === 200, 'contexto 200');
    for (
      const want of [
        'Guardrails',
        'Nunca faça merge',
        'Seu bloco: B',
        'faça o B',
        'feito o A',
        'Como operar',
      ]
    ) {
      assert(ctx.text.includes(want), `contexto contém "${want}"`);
    }
    const overview = await call('GET', `/trilhas/${id}/context`);
    assert(overview.text.includes('## Estado'), 'visão geral sem bloco');
    assert(
      (await call('GET', `/trilhas/${id}/context?node=zzz`)).status === 404,
      'bloco inexistente 404',
    );
  });
});

Deno.test('macro bloqueada não executa e rota exige trilha', async () => {
  await withApi(async (call) => {
    const { id } = await setup(call);
    const none = await call('POST', `/trilhas/${id}/macros/nao-existe/run`, {});
    assert(none.status === 404, 'macro inexistente');
    const noTrilha = await call('GET', '/trilhas/xxxx/context');
    assert(noTrilha.status === 404, 'trilha inexistente');
  });
});

Deno.test('createEdge continua barrando ciclo com grupos', async () => {
  await withApi(async (call, kv) => {
    const { id, a, b } = await setup(call);
    const { error } = await createEdge(kv, id, b, a, () => Promise.resolve(id));
    assert(error === 'cycle', 'ciclo recusado');
    const t = await createTrilha(kv, { title: 'x', objective: 'y' });
    const n = await createNode(
      kv,
      t.id,
      { title: 'n', group: '  frente  ' },
      0,
    );
    assert(n.group === 'frente', 'grupo normalizado');
  });
});

Deno.test('mover bloco é layout: vale com trava alheia e não invalida o briefing', async () => {
  await withApi(async (call) => {
    const { id, a } = await setup(call);
    await call('POST', `/trilhas/${id}/nodes/${a}/claim`, { by: 'agente' });
    const before =
      ((await call('GET', `/trilhas/${id}/nodes/${a}`)).data as TrilhaNode)
        .updatedAt;
    const moved = await call('PUT', `/trilhas/${id}/nodes/${a}`, {
      position: { x: 500, y: 700 },
    });
    assert(moved.status === 200, 'mover com trava de outro dono passa');
    const node = (await call('GET', `/trilhas/${id}/nodes/${a}`))
      .data as TrilhaNode;
    assert(
      node.position.x === 500 && node.position.y === 700,
      'posição gravada',
    );
    assert(
      node.updatedAt === before,
      'updatedAt intacto (expectedUpdatedAt dos agentes segue válido)',
    );
    const edit = await call('PUT', `/trilhas/${id}/nodes/${a}`, {
      title: 'novo',
    });
    assert(edit.status === 409, 'editar conteúdo continua exigindo o dono');
    const events = (await call('GET', `/trilhas/${id}/events`)).data as Array<
      { type: string }
    >;
    assert(
      !events.some((e) => e.type === 'node.updated'),
      'mover não polui a atividade',
    );
  });
});
