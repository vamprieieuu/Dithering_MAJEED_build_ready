import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function serveAexBinaryPlugin(): Plugin {
  const resolveAexPath = (): string | null => {
    const candidates = [
      path.resolve(__dirname, 'dist', 'YMDithers.aex'),
      path.resolve(__dirname, 'public', 'YMDithers.aex'),
      path.resolve(__dirname, 'build', 'YMDithers.aex'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const buf = fs.readFileSync(candidate);
        if (buf.length > 1024 && buf[0] === 0x4d && buf[1] === 0x5a) {
          return candidate;
        }
      }
    }
    return null;
  };

  return {
    name: 'serve-ymdithers-aex-binary',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = (req.url || '').split('?')[0];
        if (cleanUrl === '/YMDithers.aex' || cleanUrl === '/dist/YMDithers.aex') {
          const aexPath = resolveAexPath();
          if (aexPath) {
            const buf = fs.readFileSync(aexPath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', 'attachment; filename="YMDithers.aex"');
            res.setHeader('Content-Length', String(buf.length));
            res.setHeader('Cache-Control', 'no-store');
            res.end(buf);
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      const srcPath = path.resolve(__dirname, 'public', 'YMDithers.aex');
      const distPath = path.resolve(__dirname, 'dist', 'YMDithers.aex');
      if (fs.existsSync(srcPath)) {
        fs.mkdirSync(path.dirname(distPath), { recursive: true });
        fs.copyFileSync(srcPath, distPath);
      }
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    emptyOutDir: false,
  },
  plugins: [serveAexBinaryPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
