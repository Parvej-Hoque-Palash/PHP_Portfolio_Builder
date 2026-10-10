import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev-server stand-in for the registry Netlify Function (netlify/functions/registry.ts),
 * backed by public/portfolios.json. It trusts the posted username (no token check),
 * which is fine locally. `vite preview` and builds don't get it.
 */
function devRegistry(): Plugin {
  return {
    name: 'dev-portfolio-registry',
    apply: 'serve',
    configureServer(server) {
      const file = path.join(server.config.publicDir, 'portfolios.json');
      const readRegistry = async (): Promise<Record<string, unknown>> => {
        try {
          return JSON.parse(await readFile(file, 'utf8'));
        } catch {
          return {}; // missing or malformed: start fresh
        }
      };

      server.middlewares.use('/.netlify/functions/registry', (req, res) => {
        const reply = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        if (req.method === 'GET') {
          const username = new URL(req.url ?? '', 'http://localhost').searchParams.get('username')?.toLowerCase() ?? '';
          readRegistry().then((registry) => {
            const fileId = registry[username];
            if (typeof fileId === 'string' && fileId) reply(200, { username, fileId });
            else reply(404, { error: 'Not registered' });
          });
          return;
        }
        if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });

        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const { username, fileId } = JSON.parse(body) as { username?: unknown; fileId?: unknown };
            if (typeof username !== 'string' || !/^php-[a-z0-9-]+$/.test(username)) return reply(400, { error: 'Invalid username' });
            if (typeof fileId !== 'string' || !/^[\w-]{10,200}$/.test(fileId)) return reply(400, { error: 'Invalid file ID' });

            const registry = await readRegistry();
            if (registry[username] !== fileId) {
              registry[username] = fileId;
              await writeFile(file, JSON.stringify(registry, null, 2) + '\n');
              server.config.logger.info(`portfolios.json: listed "${username}"`, { timestamp: true });
            }
            reply(200, { username, fileId });
          } catch (err) {
            reply(500, { error: err instanceof Error ? err.message : 'Failed to update portfolios.json' });
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devRegistry()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
