// Canvas WebSocket Hub — singleton
// Mantém as conexões WebSocket e gerencia broadcast de conteúdo HTML
// para todas as instâncias do canvas conectadas.

export interface CanvasMessage {
  readonly type: 'replace' | 'append' | 'css' | 'clear';
  readonly html?: string;
}

class CanvasHub {
  readonly #connections = new Set<WebSocket>();
  /** Conteúdo HTML acumulado atual — enviado a late joiners. */
  #currentContent = '';

  /** Número de conexões WebSocket ativas. */
  get connectionCount(): number {
    return this.#connections.size;
  }

  /** Conteúdo HTML atual do canvas. */
  get currentContent(): string {
    return this.#currentContent;
  }

  /** Registra uma nova conexão WebSocket e envia o estado atual. */
  add(ws: WebSocket): void {
    this.#connections.add(ws);
    // Late joiner: envia o conteúdo atual assim que conecta
    if (this.#currentContent) {
      this.#send(ws, JSON.stringify({ type: 'replace', html: this.#currentContent }));
    }
    ws.addEventListener('close', () => this.#connections.delete(ws));
    ws.addEventListener('error', () => this.#connections.delete(ws));
  }

  /**
   * Faz broadcast de uma mensagem para todos os clientes conectados.
   * O hub acumula o conteúdo interno independentemente do tipo e sempre
   * envia o estado completo como `replace` — o cliente só precisa
   * redefinir o srcdoc do iframe.
   */
  broadcast(msg: CanvasMessage): void {
    // Atualiza estado interno acumulado
    if (msg.type === 'replace') {
      this.#currentContent = msg.html ?? '';
    } else if (msg.type === 'append') {
      this.#currentContent += msg.html ?? '';
    } else if (msg.type === 'css') {
      this.#currentContent += `<style>\n${msg.html ?? ''}\n</style>`;
    } else if (msg.type === 'clear') {
      this.#currentContent = '';
    }

    // Clientes só recebem 'replace' com o conteúdo completo
    const data = JSON.stringify({ type: 'replace', html: this.#currentContent });
    for (const ws of this.#connections) {
      this.#send(ws, data);
    }
  }

  #send(ws: WebSocket, data: string): void {
    try {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
      else this.#connections.delete(ws);
    } catch (err) {
      console.error('canvas hub: send error', err);
      this.#connections.delete(ws);
    }
  }
}

export const canvasHub = new CanvasHub();
