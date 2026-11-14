// Relatórios completos ficam no filesystem (KV tem teto de ~64 KiB/valor).
// O run guarda apenas metadados + `hasReport`.

import { dataDir } from '../config.ts';

const MAX_REPORT_BYTES = 1024 * 1024; // 1 MiB
const SAFE_ID = /^[a-zA-Z0-9-]+$/;

export const monitorsDir = (): string =>
  Deno.env.get('DOCMAP_MONITORS_DIR') ?? `${dataDir()}/monitors`;

const reportPath = (monitorId: string, runId: string): string | null => {
  if (!SAFE_ID.test(monitorId) || !SAFE_ID.test(runId)) return null;
  return `${monitorsDir()}/${monitorId}/${runId}.md`;
};

export const saveReport = async (
  monitorId: string,
  runId: string,
  body: string,
): Promise<boolean> => {
  const path = reportPath(monitorId, runId);
  if (!path) return false;
  const trimmed = body.slice(0, MAX_REPORT_BYTES);
  await Deno.mkdir(`${monitorsDir()}/${monitorId}`, { recursive: true });
  await Deno.writeTextFile(path, trimmed);
  return true;
};

export const readReport = async (
  monitorId: string,
  runId: string,
): Promise<string | null> => {
  const path = reportPath(monitorId, runId);
  if (!path) return null;
  try {
    return await Deno.readTextFile(path);
  } catch {
    return null;
  }
};

export const deleteMonitorReports = async (
  monitorId: string,
): Promise<void> => {
  if (!SAFE_ID.test(monitorId)) return;
  await Deno.remove(`${monitorsDir()}/${monitorId}`, { recursive: true }).catch(
    () => {},
  );
};
