Deno.env.set('DOCMAP_KILL_PORTS', 'true');

await import('./main.ts');
