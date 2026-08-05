import './env.ts';
import { openWindow } from './window/app.ts';
import { UI_PORT } from './server/server.ts';

// Sobe os servidores num worker (thread separada) e só abre a janela
// depois que eles avisam que estão prontos — evita a corrida em que o
// webview navega antes do servidor responder.
const startServerWorker = (): Promise<Worker> =>
  new Promise((resolve) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url).href, {
      type: 'module',
    });
    worker.onmessage = (e) => {
      if (e.data?.type === 'ready') {
        console.log(`\n  ⬡  docmap desktop\n`);
        resolve(worker);
      }
    };
  });

const main = async (): Promise<void> => {
  const worker = await startServerWorker();

  // openWindow bloqueia a thread principal até a janela fechar
  openWindow({ port: UI_PORT });

  // Janela fechada → encerra tudo de forma limpa (evita instâncias zumbis
  // que segurariam as portas e serviriam código velho no próximo boot).
  worker.terminate();
  Deno.exit(0);
};

await main();
