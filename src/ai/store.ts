// ════ Persistência da config de AI no KV ════

import type { Provider, ProviderConfig } from './types.ts';
import { DEFAULT_PROVIDER } from './types.ts';

const CONFIG_KEY = ['ai', 'config'] as const;

export const getProvider = async (kv: Deno.Kv): Promise<Provider> => {
  const entry = await kv.get<ProviderConfig>(CONFIG_KEY);
  return entry.value?.provider ?? DEFAULT_PROVIDER;
};

export const saveProvider =
  (kv: Deno.Kv) => async (provider: Provider): Promise<void> => {
    await kv.set(CONFIG_KEY, { provider } satisfies ProviderConfig);
  };
