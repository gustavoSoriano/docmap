import { refsRoutes } from './routes-refs.ts';
import { signalsRoutes } from './routes-signals.ts';
import { miscRoutes } from './routes-misc.ts';

// Rotas adicionais da trilha (refs, sinais, arsenal, contexto, layout, macro,
// stream). Devolve null quando a rota não é daqui — o handler principal segue.
export const extraRoutes = async (
  kv: Deno.Kv,
  req: Request,
  url: URL,
  segments: readonly string[],
): Promise<Response | null> => {
  const [id, sub, subId, action] = segments;
  if (!id || !sub) return null;
  return await refsRoutes(kv, req, url, id, sub, subId) ??
    await signalsRoutes(kv, req, id, sub, subId) ??
    await miscRoutes(kv, req, url, id, sub, subId, action);
};
