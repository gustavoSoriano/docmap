import { monitorsHandler } from './handler.ts';
import { runKey } from './store.ts';
import { defaultLimits, evaluateMonitor, normalizeLimits } from './policy.ts';
import type { Monitor } from './types.ts';

const assert: (condition: unknown, message: string) => asserts condition = (
  condition,
  message,
) => {
  if (!condition) throw new Error(message);
};

const assertEquals = (a: unknown, b: unknown): void => {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(
      `assertEquals falhou: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`,
    );
  }
};

const jsonBody = async (res: Response): Promise<Record<string, unknown>> =>
  await res.json() as Record<string, unknown>;

const withHandler = async (
  fn: (ctx: {
    kv: Deno.Kv;
    request: (
      method: string,
      path: string,
      body?: unknown,
    ) => Promise<Response>;
  }) => Promise<void>,
): Promise<void> => {
  const dir = await Deno.makeTempDir({ prefix: 'docmap-monitors-' });
  const previous = Deno.env.get('DOCMAP_MONITORS_DIR');
  Deno.env.set('DOCMAP_MONITORS_DIR', `${dir}/reports`);
  const kv = await Deno.openKv(`${dir}/test.sqlite3`);
  const handler = monitorsHandler(kv);
  const request = (method: string, path: string, body?: unknown) => {
    const init: RequestInit = { method };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers = { 'Content-Type': 'application/json' };
    }
    return handler(
      new Request(`http://127.0.0.1${path}`, init),
      new URL(`http://127.0.0.1${path}`),
    );
  };
  try {
    await fn({ kv, request });
  } finally {
    kv.close();
    if (previous === undefined) Deno.env.delete('DOCMAP_MONITORS_DIR');
    else Deno.env.set('DOCMAP_MONITORS_DIR', previous);
    await Deno.remove(dir, { recursive: true });
  }
};

const createMonitor = async (
  request: (method: string, path: string, body?: unknown) => Promise<Response>,
  extra: Record<string, unknown> = {},
): Promise<Record<string, unknown>> => {
  const res = await request('POST', '/monitors', {
    title: 'Alarmes do Slack',
    objective: 'Ver #alarms e investigar alarme novo.',
    intervalMinutes: 5,
    startNow: true,
    ...extra,
  });
  assertEquals(res.status, 201);
  return await jsonBody(res);
};

Deno.test('monitors: cria, entrega um run e fecha no report', async () => {
  await withHandler(async ({ request }) => {
    const monitor = await createMonitor(request);

    const tick = await request('POST', `/monitors/${monitor.id}/tick`, {
      agent: 'test-agent',
    });
    assertEquals(tick.status, 200);
    const claim = await jsonBody(tick);
    assertEquals(claim.due, true);
    const run = claim.run as { id: string; seq: number };
    assert(run.id, 'run.id vazio');
    assertEquals(run.seq, 1);
    assert(
      String(claim.prompt).includes(String(monitor.id)),
      'prompt sem id do monitor',
    );

    const second = await request('POST', `/monitors/${monitor.id}/tick`, {
      agent: 'other',
    });
    assertEquals(second.status, 409);
    const secondBody = await jsonBody(second);
    assertEquals(
      (secondBody.evaluation as { code: string }).code,
      'run_in_progress',
    );

    const report = await request(
      'POST',
      `/monitors/runs/${run.id}/report`,
      {
        status: 'no-change',
        summary: 'Nada novo.',
        state: { cursor: 'ts:123', memory: 'sem alarmes' },
        usage: { tokensIn: 1000, tokensOut: 500, costUsd: 0.02 },
      },
    );
    assertEquals(report.status, 200);

    const detail = await jsonBody(
      await request('GET', `/monitors/${monitor.id}`),
    );
    const state = detail.state as Record<string, unknown>;
    const usage = detail.usage as Record<string, unknown>;
    const runs = detail.runs as Array<Record<string, unknown>>;
    assertEquals(state.cursor, 'ts:123');
    assertEquals(state.consecutiveNoChange, 1);
    assertEquals(usage.runsToday, 1);
    assertEquals(usage.tokensToday, 1500);
    assertEquals(runs.length, 1);
    assertEquals(runs[0].status, 'no-change');
  });
});

Deno.test('monitors: defaults e conclusão sem review', async () => {
  await withHandler(async ({ request }) => {
    const monitor = await createMonitor(request);
    const limits = monitor.limits as Record<string, number>;
    assertEquals(monitor.requireDoneApproval, false);
    assertEquals(limits.maxRunsPerDay, 50);
    assertEquals(limits.maxTokensPerDay, 200000);
    assertEquals(limits.maxCostUsdPerDay, 5);

    const run = (await jsonBody(
      await request('POST', `/monitors/${monitor.id}/tick`),
    )).run as { id: string };
    await request('POST', `/monitors/runs/${run.id}/report`, {
      status: 'done',
      summary: 'Concluído.',
      evidence: 'Checagem final ok.',
    });
    const detail = await jsonBody(
      await request('GET', `/monitors/${monitor.id}`),
    );
    assertEquals(detail.status, 'done');
  });
});

Deno.test('monitors: teto diário bloqueia novos runs', async () => {
  await withHandler(async ({ request }) => {
    const monitor = await createMonitor(request, {
      limits: { maxRunsPerDay: 1 },
    });
    const tick = await jsonBody(
      await request('POST', `/monitors/${monitor.id}/tick`),
    );
    const run = tick.run as { id: string };
    await request('POST', `/monitors/runs/${run.id}/report`, {
      status: 'no-change',
      summary: 'ok',
    });

    await request('POST', `/monitors/${monitor.id}/kick`);
    const blocked = await request('POST', `/monitors/${monitor.id}/tick`);
    assertEquals(blocked.status, 409);
    const body = await jsonBody(blocked);
    assertEquals((body.evaluation as { code: string }).code, 'daily_runs');
  });
});

Deno.test('monitors: done vai para review e humano aceita', async () => {
  await withHandler(async ({ request }) => {
    const monitor = await createMonitor(request, { requireDoneApproval: true });
    const run = (await jsonBody(
      await request('POST', `/monitors/${monitor.id}/tick`),
    )).run as { id: string };

    await request('POST', `/monitors/runs/${run.id}/report`, {
      status: 'done',
      summary: 'Alarme investigado.',
      evidence: 'Relatório em #incidentes e app estável.',
    });

    let detail = await jsonBody(
      await request('GET', `/monitors/${monitor.id}`),
    );
    assertEquals(detail.status, 'review');

    const accepted = await request('POST', `/monitors/${monitor.id}/decide`, {
      decision: 'accept',
    });
    assertEquals(accepted.status, 200);
    detail = await jsonBody(await request('GET', `/monitors/${monitor.id}`));
    assertEquals(detail.status, 'done');
  });
});

Deno.test('monitors: done exige evidência e todos os critérios', async () => {
  await withHandler(async ({ request }) => {
    const monitor = await createMonitor(request, {
      doneCriteria: ['canal lido', 'relatório publicado'],
    });
    const run = (await jsonBody(
      await request('POST', `/monitors/${monitor.id}/tick`),
    )).run as { id: string };

    const noEvidence = await request(
      'POST',
      `/monitors/runs/${run.id}/report`,
      { status: 'done', summary: 'feito' },
    );
    assertEquals(noEvidence.status, 400);

    const incomplete = await request(
      'POST',
      `/monitors/runs/${run.id}/report`,
      {
        status: 'done',
        evidence: 'captura de tela',
        criteria: [{ index: 1, done: true }],
      },
    );
    assertEquals(incomplete.status, 422);
    const missing = await jsonBody(incomplete);
    assertEquals(missing.error, 'criteria_incomplete');
    assertEquals(missing.missing, ['relatório publicado']);

    const ok = await request('POST', `/monitors/runs/${run.id}/report`, {
      status: 'done',
      evidence: 'captura de tela',
      criteria: [
        { text: 'canal lido', done: true },
        { index: 2, done: true, evidence: 'link do relatório' },
      ],
    });
    assertEquals(ok.status, 200);
    const body = await jsonBody(ok);
    const reported = body.run as Record<string, unknown>;
    const criteria = reported.criteria as Array<Record<string, unknown>>;
    assertEquals(criteria.length, 2);
    assertEquals(criteria[1].done, true);
    assertEquals(criteria[1].evidence, 'link do relatório');
  });
});

Deno.test('monitors: lease vencido vira expired e conta falha', async () => {
  await withHandler(async ({ kv, request }) => {
    const monitor = await createMonitor(request);
    const run = (await jsonBody(
      await request('POST', `/monitors/${monitor.id}/tick`),
    )).run as { id: string };

    const key = runKey(String(monitor.id), run.id);
    const entry = await kv.get<Record<string, unknown>>(key);
    assert(entry.value, 'run não encontrado');
    await kv.set(key, {
      ...entry.value,
      leaseExpiresAt: new Date(Date.now() - 60_000).toISOString(),
    });

    await request('POST', `/monitors/${monitor.id}/tick`);
    const detail = await jsonBody(
      await request('GET', `/monitors/${monitor.id}`),
    );
    const state = detail.state as Record<string, unknown>;
    const runs = detail.runs as Array<Record<string, unknown>>;
    assertEquals(state.consecutiveFailures, 1);
    assertEquals(runs[0].status, 'expired');
  });
});

Deno.test('monitors: policy aplica prazo e orçamento', () => {
  const now = Date.now();
  const limits = normalizeLimits({
    expiresAt: new Date(now - 1000).toISOString(),
  }, defaultLimits(now));
  const monitor: Monitor = {
    id: 'm1',
    title: 't',
    objective: 'o',
    status: 'active',
    intervalMinutes: 5,
    nextRunAt: new Date(now - 1000).toISOString(),
    lastRunAt: null,
    guardrails: [],
    doneCriteria: [],
    requireDoneApproval: true,
    tags: [],
    limits,
    state: {
      cursor: '',
      memory: '',
      consecutiveNoChange: 0,
      consecutiveFailures: 0,
    },
    usage: {
      day: '2026-01-01',
      runsToday: 0,
      tokensToday: 0,
      costToday: 0,
      runsTotal: 0,
      tokensTotal: 0,
      costTotal: 0,
    },
    lastRunSeq: 0,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };
  const evaluation = evaluateMonitor({
    ...monitor,
    usage: { ...monitor.usage, day: 'x' },
  }, now);
  assert(evaluation.due === false, 'monitor expirado não deveria rodar');
  if (!evaluation.due) {
    assertEquals(evaluation.code, 'expired');
    assertEquals(evaluation.applyStatus, 'halted');
  }
});
