// Rotas de monitors — compartilhadas pela UI (:3333) e pela AI API (:3334).

import { badRequest, conflict, json, notFound } from '../server/response.ts';
import type {
  CreateMonitorInput,
  DecideMonitorInput,
  ReportRunInput,
  UpdateMonitorInput,
} from './types.ts';
import {
  createMonitor,
  decideMonitorDone,
  deleteMonitor,
  getMonitor,
  kickMonitor,
  listMonitors,
  pauseMonitor,
  resumeMonitor,
  updateMonitor,
} from './store.ts';
import {
  claimMonitor,
  getRun,
  heartbeatRun,
  listRuns,
  reportRun,
  waitForRun,
} from './runs.ts';
import { buildMonitorPrompt } from './prompt.ts';
import { remainingBudget } from './policy.ts';
import { deleteMonitorReports, readReport } from './reports.ts';
import { isPast } from './time.ts';

const UI = 'http://127.0.0.1:3333';

const deepLink = (id: string): string => `${UI}/#monitor/${id}`;

const withMeta = <T extends { readonly id: string }>(value: T) => ({
  ...value,
  deepLink: deepLink(value.id),
});

const text = (body: string, type = 'text/markdown; charset=utf-8'): Response =>
  new Response(body, { headers: { 'Content-Type': type } });

const bodyOf = async (req: Request): Promise<Record<string, unknown>> => {
  try {
    const parsed = await req.json();
    return parsed && typeof parsed === 'object'
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
};

const claimPayload = (
  monitor: NonNullable<Awaited<ReturnType<typeof getMonitor>>>,
  run: {
    readonly id: string;
  },
) => ({
  due: true,
  run,
  monitor,
  remainingBudget: remainingBudget(monitor),
  prompt: buildMonitorPrompt(monitor),
  urls: {
    heartbeat: `/monitors/runs/${run.id}/heartbeat`,
    report: `/monitors/runs/${run.id}/report`,
  },
});

export const monitorsHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/monitors\/?/, '').split('/')
      .filter(Boolean);
    const [first, second, third] = segments;

    // ── Inbox global (long-poll) ──
    if (first === 'inbox' && req.method === 'GET') {
      const agent = (url.searchParams.get('agent') ?? 'agent').slice(0, 80);
      const waitRaw = Number(url.searchParams.get('wait') ?? '60');
      const wait = Number.isFinite(waitRaw)
        ? Math.min(600, Math.max(0, Math.floor(waitRaw)))
        : 60;
      const result = await waitForRun(kv, agent, wait);
      if (!result.claimed) {
        const all = await listMonitors(kv);
        const count = (status: string) =>
          all.filter((m) => m.status === status).length;
        return json({
          due: false,
          waitedSeconds: wait,
          evaluation: result.evaluation,
          meta: {
            active: count('active'),
            paused: count('paused'),
            halted: count('halted'),
            review: count('review'),
            done: count('done'),
            resumeRequiresHuman: true,
          },
        });
      }
      return json(claimPayload(result.monitor, result.run));
    }

    // ── Runs e ações (por id, sem depender do monitor) ──
    if (first === 'runs' && second) {
      const found = await getRun(kv, second);
      if (!found) return notFound();

      if (!third && req.method === 'GET') {
        return json({
          run: found.run,
          monitor: found.monitor,
          deepLink: deepLink(found.monitor.id),
        });
      }
      if (third === 'heartbeat' && req.method === 'POST') {
        const body = await bodyOf(req);
        const updated = await heartbeatRun(
          kv,
          second,
          typeof body.agent === 'string' ? body.agent : undefined,
        );
        if (!updated) return notFound();
        return json(updated);
      }
      if (third === 'report') {
        if (req.method === 'GET') {
          const markdown = await readReport(found.monitor.id, found.run.id);
          if (markdown === null) return notFound();
          return text(markdown);
        }
        if (req.method === 'POST') {
          const body = await bodyOf(req);
          const reported = await reportRun(
            kv,
            second,
            body as unknown as ReportRunInput,
          );
          if (!reported.ok) {
            if (reported.code === 'not_found') return notFound();
            if (reported.code === 'already_finished') {
              return conflict('run já finalizado');
            }
            if (reported.code === 'criteria_incomplete') {
              return json({
                error: 'criteria_incomplete',
                missing: reported.missing ?? [],
              }, 422);
            }
            if (reported.code === 'evidence_required') {
              return badRequest('evidence é obrigatório para done');
            }
            return badRequest(reported.code);
          }
          return json({
            run: reported.run,
            monitor: reported.monitor,
            ...(reported.stopped ? { stopped: reported.stopped } : {}),
            deepLink: deepLink(found.monitor.id),
          });
        }
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    // ── Lista e criação ──
    if (!first) {
      if (req.method === 'GET') {
        return json((await listMonitors(kv)).map(withMeta));
      }
      if (req.method === 'POST') {
        const body = await bodyOf(req);
        if (
          typeof body.title !== 'string' || !body.title.trim() ||
          typeof body.objective !== 'string' || !body.objective.trim()
        ) {
          return badRequest('title e objective são obrigatórios');
        }
        const created = await createMonitor(
          kv,
          body as unknown as CreateMonitorInput,
        );
        return json(withMeta(created), 201);
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    // ── Por monitor ──
    const monitor = await getMonitor(kv, first);
    if (!monitor) return notFound();

    if (!second && req.method === 'GET') {
      const runs = await listRuns(kv, monitor.id, 50);
      return json({ ...withMeta(monitor), runs });
    }

    if (!second && req.method === 'PUT') {
      const body = await bodyOf(req);
      const updated = await updateMonitor(
        kv,
        first,
        body as unknown as UpdateMonitorInput,
      );
      if (!updated) return notFound();
      return json(withMeta(updated));
    }

    if (!second && req.method === 'DELETE') {
      const deleted = await deleteMonitor(kv, first);
      if (deleted) await deleteMonitorReports(first);
      return json({ ok: deleted });
    }

    if (second === 'prompt' && req.method === 'GET') {
      return text(buildMonitorPrompt(monitor));
    }

    if (second === 'runs' && req.method === 'GET') {
      const limitRaw = Number(url.searchParams.get('limit') ?? '100');
      const limit = Number.isFinite(limitRaw) ? limitRaw : 100;
      return json(await listRuns(kv, monitor.id, limit));
    }

    if (second === 'tick' && req.method === 'POST') {
      const body = await bodyOf(req);
      const agent = typeof body.agent === 'string' && body.agent.trim()
        ? body.agent.trim().slice(0, 80)
        : 'agent';
      const result = await claimMonitor(kv, monitor.id, agent);
      if (!result.claimed) {
        return json({
          due: false,
          monitor: result.monitor,
          evaluation: result.evaluation,
        }, 409);
      }
      return json(claimPayload(result.monitor, result.run));
    }

    if (second === 'kick' && req.method === 'POST') {
      if (monitor.status !== 'active') {
        return conflict(`monitor ${monitor.status}`);
      }
      return json(withMeta(await kickMonitor(kv, monitor.id) ?? monitor));
    }

    if (second === 'pause' && req.method === 'POST') {
      const body = await bodyOf(req);
      const reason = typeof body.reason === 'string' ? body.reason : undefined;
      return json(
        withMeta(await pauseMonitor(kv, monitor.id, reason) ?? monitor),
      );
    }

    if (second === 'resume' && req.method === 'POST') {
      if (
        monitor.limits.expiresAt && isPast(monitor.limits.expiresAt, Date.now())
      ) {
        return conflict('expired');
      }
      return json(withMeta(await resumeMonitor(kv, monitor.id) ?? monitor));
    }

    if (second === 'decide' && req.method === 'POST') {
      const body = await bodyOf(req);
      const input = body as unknown as DecideMonitorInput;
      if (input.decision !== 'accept' && input.decision !== 'reject') {
        return badRequest('decision deve ser accept ou reject');
      }
      const decided = await decideMonitorDone(kv, monitor.id, input.decision);
      if (!decided) return conflict('monitor não está em review');
      return json(withMeta(decided));
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
