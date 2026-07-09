import { APP_VERSION } from '../../config.ts';
import { skillMarkdown } from '../../skill.ts';
import { exportKv, importKv } from '../../kv/backup.ts';
import { applyUpdate } from '../../update/apply.ts';
import { openFileDialog } from '../../window/dialog.ts';
import type { UpdateStatus } from '../../update/github.ts';
import { json, badRequest } from '../response.ts';
import type { HandlerDeps } from '../types.ts';

const UPDATE_KEY = ['_meta', 'update'] as const;

export const createSystemHandler = ({ kv }: HandlerDeps) =>
  async (req: Request, url: URL): Promise<Response> => {
    // GET /system — versão + status de update
    if (req.method === 'GET' && url.pathname === '/system') {
      const upd = await kv.get<UpdateStatus>(UPDATE_KEY);
      return json({ version: APP_VERSION, update: upd.value ?? null });
    }

    // GET /system/skill — instruções da API de notas para colar numa IA
    if (req.method === 'GET' && url.pathname === '/system/skill') {
      return new Response(skillMarkdown(), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      });
    }

    // POST /system/backup — salva o backup em ~/Downloads/ e retorna o caminho
    // (webview não suporta download programático via <a>, então o servidor escreve direto no disco)
    if (req.method === 'POST' && url.pathname === '/system/backup') {
      const backup = await exportKv(kv);
      const home     = Deno.env.get('HOME') ?? '.';
      const filename = `docmap-backup-${backup.exportedAt.slice(0, 10)}.json`;
      const dest     = `${home}/Downloads/${filename}`;
      await Deno.writeTextFile(dest, JSON.stringify(backup, null, 2));
      return json({ ok: true, path: dest, filename, entries: backup.entries.length });
    }

    // GET /system/backup — retorna JSON bruto (para curl / IA)
    if (req.method === 'GET' && url.pathname === '/system/backup') {
      const backup = await exportKv(kv);
      return new Response(JSON.stringify(backup, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    // POST /system/restore-pick — abre dialog nativo e restaura o arquivo selecionado
    if (req.method === 'POST' && url.pathname === '/system/restore-pick') {
      const path = await openFileDialog('Selecionar backup do docmap');
      if (!path) return json({ cancelled: true });
      let body: unknown;
      try { body = JSON.parse(await Deno.readTextFile(path)); } catch { return badRequest('Arquivo inválido'); }
      const replace = url.searchParams.get('replace') === 'true';
      try {
        const count = await importKv(kv, body as Parameters<typeof importKv>[1], replace);
        return json({ ok: true, imported: count, path });
      } catch (err) {
        return badRequest(err instanceof Error ? err.message : 'restore falhou');
      }
    }

    // POST /system/restore — importa um backup (merge por padrão)
    if (req.method === 'POST' && url.pathname === '/system/restore') {
      let body: unknown;
      try { body = await req.json(); } catch { return badRequest('JSON inválido'); }
      const replace = url.searchParams.get('replace') === 'true';
      try {
        const count = await importKv(kv, body as Parameters<typeof importKv>[1], replace);
        return json({ ok: true, imported: count });
      } catch (err) {
        return badRequest(err instanceof Error ? err.message : 'restore falhou');
      }
    }

    // POST /system/update — aplica a atualização (troca o binário)
    if (req.method === 'POST' && url.pathname === '/system/update') {
      const upd = await kv.get<UpdateStatus>(UPDATE_KEY);
      const assetUrl = upd.value?.assetUrl;
      if (!assetUrl) return badRequest('Nenhum binário disponível para atualizar');
      try {
        await applyUpdate(assetUrl);
        return json({ ok: true, message: 'Atualizado. Reinicie o app.' });
      } catch (err) {
        return badRequest(err instanceof Error ? err.message : 'update falhou');
      }
    }

    // POST /system/open-url — abre URL no browser padrão do sistema
    // (webview não suporta window.open para URLs externas)
    if (req.method === 'POST' && url.pathname === '/system/open-url') {
      let body: unknown;
      try { body = await req.json(); } catch { return badRequest('JSON inválido'); }
      const target = typeof body === 'object' && body !== null && 'url' in body
        ? String((body as Record<string, unknown>).url)
        : '';
      if (!/^https?:\/\//i.test(target)) return badRequest('URL inválida');
      const cmd = Deno.build.os === 'windows' ? 'cmd'
                : Deno.build.os === 'darwin'  ? 'open'
                : 'xdg-open';
      const args = Deno.build.os === 'windows' ? ['/c', 'start', '', target] : [target];
      try {
        await new Deno.Command(cmd, { args, stdout: 'null', stderr: 'null' }).output();
        return json({ ok: true });
      } catch (err) {
        return badRequest(err instanceof Error ? err.message : 'falha ao abrir URL');
      }
    }

    return badRequest('rota de sistema desconhecida');
  };
