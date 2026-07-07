const enc = new TextEncoder();
const subscribers = new Set<ReadableStreamDefaultController<Uint8Array>>();

export type DiagramEvent =
  | { type: 'created'; diagram: Record<string, unknown> }
  | { type: 'updated'; diagram: Record<string, unknown> }
  | { type: 'deleted'; id: string };

export const subscribe = (): ReadableStream<Uint8Array> => {
  let ctrl!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      ctrl = c;
      subscribers.add(ctrl);
      ctrl.enqueue(enc.encode(': ping\n\n'));
    },
    cancel() { subscribers.delete(ctrl); },
  });
  return stream;
};

export const broadcast = (event: DiagramEvent): void => {
  const msg = enc.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  for (const ctrl of subscribers) {
    try { ctrl.enqueue(msg); } catch { subscribers.delete(ctrl); }
  }
};
