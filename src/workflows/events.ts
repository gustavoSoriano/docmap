import type { WorkflowEvent } from './types.ts';

const encoder = new TextEncoder();
const subscribers = new Set<
  ReadableStreamDefaultController<Uint8Array>
>();
const recentEvents: Array<{
  readonly revision: number;
  readonly event: RealtimeWorkflowEvent;
}> = [];
const eventWaiters = new Set<{
  readonly afterRevision: number;
  readonly predicate: (event: RealtimeWorkflowEvent) => boolean;
  readonly resolve: (result: WorkflowEventWaitResult) => void;
}>();
const RECENT_EVENT_LIMIT = 256;
let eventRevision = 0;

export type RealtimeWorkflowEvent =
  | WorkflowEvent
  | {
    readonly id: string;
    readonly type: string;
    readonly payload: Record<string, unknown>;
    readonly createdAt: string;
  };

export type WorkflowEventWaitResult = {
  readonly reason: 'event' | 'timeout' | 'aborted';
  readonly revision: number;
  readonly event?: RealtimeWorkflowEvent;
};

export const getWorkflowEventRevision = (): number => eventRevision;

export const waitForWorkflowEvent = (
  options: {
    readonly afterRevision: number;
    readonly timeoutMs: number;
    readonly signal?: AbortSignal;
    readonly predicate?: (event: RealtimeWorkflowEvent) => boolean;
  },
): Promise<WorkflowEventWaitResult> => {
  const predicate = options.predicate ?? (() => true);
  const buffered = recentEvents.find((item) =>
    item.revision > options.afterRevision && predicate(item.event)
  );
  if (buffered) {
    return Promise.resolve({
      reason: 'event',
      revision: buffered.revision,
      event: buffered.event,
    });
  }
  if (eventRevision > options.afterRevision) {
    return Promise.resolve({
      reason: 'event',
      revision: eventRevision,
    });
  }
  if (options.signal?.aborted) {
    return Promise.resolve({
      reason: 'aborted',
      revision: eventRevision,
    });
  }

  return new Promise((resolve) => {
    const waiter = {
      afterRevision: options.afterRevision,
      predicate,
      resolve: (result: WorkflowEventWaitResult) => {
        eventWaiters.delete(waiter);
        clearTimeout(timeoutId);
        options.signal?.removeEventListener('abort', onAbort);
        resolve(result);
      },
    };
    const onAbort = () =>
      waiter.resolve({ reason: 'aborted', revision: eventRevision });

    eventWaiters.add(waiter);
    options.signal?.addEventListener('abort', onAbort, { once: true });
    const timeoutId = setTimeout(
      () => waiter.resolve({ reason: 'timeout', revision: eventRevision }),
      Math.max(0, options.timeoutMs),
    );
  });
};

export const subscribeWorkflowEvents = (): ReadableStream<Uint8Array> => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  return new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      subscribers.add(controller);
      controller.enqueue(encoder.encode(': connected\n\n'));
    },
    cancel() {
      subscribers.delete(controller);
    },
  });
};

export const broadcastWorkflowEvent = (
  event: RealtimeWorkflowEvent,
): void => {
  eventRevision += 1;
  recentEvents.push({ revision: eventRevision, event });
  if (recentEvents.length > RECENT_EVENT_LIMIT) recentEvents.shift();

  for (const waiter of [...eventWaiters]) {
    if (
      eventRevision > waiter.afterRevision &&
      waiter.predicate(event)
    ) {
      waiter.resolve({
        reason: 'event',
        revision: eventRevision,
        event,
      });
    }
  }

  const message = encoder.encode(
    `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
  );
  for (const controller of subscribers) {
    try {
      controller.enqueue(message);
    } catch {
      subscribers.delete(controller);
    }
  }
};
