import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function serveAexPlugin(): Plugin {
  const handleAex = (req: any, res: any, next: any) => {
    const url = req.url?.split('?')[0];
    const isV7 = url === '/dist/YMDithers_v7.aex' || url === '/YMDithers_v7.aex';
    const isLegacy = url === '/dist/YMDithers.aex' || url === '/YMDithers.aex';
    if (isV7 || isLegacy) {
      const filename = isV7 ? 'YMDithers_v7.aex' : 'YMDithers.aex';
      const candidates = [
        path.resolve(__dirname, `dist/${filename}`),
        path.resolve(__dirname, `public/dist/${filename}`),
        path.resolve(__dirname, `public/${filename}`),
        path.resolve(__dirname, filename),
        path.resolve(__dirname, 'dist/YMDithers.aex'),
        path.resolve(__dirname, 'public/dist/YMDithers.aex'),
        path.resolve(__dirname, 'public/YMDithers.aex'),
        path.resolve(__dirname, 'YMDithers.aex'),
      ];
      for (const aexPath of candidates) {
        if (fs.existsSync(aexPath)) {
          const stat = fs.statSync(aexPath);
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': stat.size,
          });
          fs.createReadStream(aexPath).pipe(res);
          return;
        }
      }
    }
    next();
  };

  return {
    name: 'serve-aex-plugin',
    configureServer(server) {
      server.middlewares.use(handleAex);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleAex);
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
