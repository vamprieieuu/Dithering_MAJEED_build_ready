import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function serveAexPlugin(): Plugin {
  return {
    name: 'serve-aex-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/dist/YMDithers.aex' || url === '/YMDithers.aex') {
          const candidates = [
            path.resolve(__dirname, 'dist/YMDithers.aex'),
            path.resolve(__dirname, 'public/dist/YMDithers.aex'),
            path.resolve(__dirname, 'public/YMDithers.aex'),
          ];
          for (const aexPath of candidates) {
            if (fs.existsSync(aexPath)) {
              const stat = fs.statSync(aexPath);
              res.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="YMDithers.aex"',
                'Content-Length': stat.size,
              });
              fs.createReadStream(aexPath).pipe(res);
              return;
            }
          }
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/dist/YMDithers.aex' || url === '/YMDithers.aex') {
          const candidates = [
            path.resolve(__dirname, 'dist/YMDithers.aex'),
            path.resolve(__dirname, 'public/dist/YMDithers.aex'),
            path.resolve(__dirname, 'public/YMDithers.aex'),
          ];
          for (const aexPath of candidates) {
            if (fs.existsSync(aexPath)) {
              const stat = fs.statSync(aexPath);
              res.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="YMDithers.aex"',
                'Content-Length': stat.size,
              });
              fs.createReadStream(aexPath).pipe(res);
              return;
            }
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveAexPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
