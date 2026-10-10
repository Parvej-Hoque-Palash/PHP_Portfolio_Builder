import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev-server endpoint the dashboard calls after a save to list the account in
 * public/portfolios.json ({ username: configFileId }). Dev only: a static
 * deployment has no server to write the file, so `vite preview` and builds don't get it.
 */
function portfolioRegistryWriter(): Plugin {
  return {
    name: 'portfolio-registry-writer',
    apply: 'serve',
    configureServer(server) {
      const file = path.join(server.config.publicDir, 'portfolios.json');
      server.middlewares.use('/__portfolio-registry', (req, res) => {
        const reply = (status: number, body: string) => {
          res.statusCode = status;
          res.end(body);
        };
        if (req.method !== 'POST') return reply(405, 'Method not allowed');

        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const { username, fileId } = JSON.parse(body) as { username?: unknown; fileId?: unknown };
            if (typeof username !== 'string' || !/^php-[a-z0-9-]+$/.test(username)) return reply(400, 'Invalid username');
            if (typeof fileId !== 'string' || !/^[\w-]{10,200}$/.test(fileId)) return reply(400, 'Invalid file ID');

            let registry: Record<string, unknown> = {};
            try {
              registry = JSON.parse(await readFile(file, 'utf8'));
            } catch {
              /* missing or malformed: start fresh */
            }
            if (registry[username] !== fileId) {
              registry[username] = fileId;
              await writeFile(file, JSON.stringify(registry, null, 2) + '\n');
              server.config.logger.info(`portfolios.json: listed "${username}"`, { timestamp: true });
            }
            reply(200, 'ok');
          } catch (err) {
            reply(500, err instanceof Error ? err.message : 'Failed to update portfolios.json');
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), portfolioRegistryWriter()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
