import { macrosHandler } from '../../macros/handler.ts';
import type { HandlerDeps } from '../../server/types.ts';

export const createApiMacrosHandler = ({ kv }: HandlerDeps) =>
  macrosHandler(kv);
