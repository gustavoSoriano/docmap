import type { WorkflowEvent } from './types.ts';

const encoder = new TextEncoder();
const subscribers = new Set<
  ReadableStreamDefaultController<Uint8Array>
>();

export type RealtimeWorkflowEvent =
  | WorkflowEvent
  | {
    readonly id: string;
    readonly type: string;
    readonly payload: Record<string, unknown>;
    readonly createdAt: string;
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
