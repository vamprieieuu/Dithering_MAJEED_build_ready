export interface SampleImage {
  id: string;
  name: string;
  category: string;
  generate: (width: number, height: number) => ImageData;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'cyber_portrait',
    name: 'Neo Cyberpunk Hologram',
    category: 'Portrait & Character',
    generate: (w: number, h: number) => {
      const data = new ImageData(w, h);
      const px = data.data;
      const cx = w * 0.5, cy = h * 0.45;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const dx = (x - cx) / (w * 0.35);
          const dy = (y - cy) / (h * 0.4);
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Head ellipse
          let head = Math.max(0, 1 - dist);
          head = Math.pow(head, 0.8);

          // Glasses visor
          const inVisor = Math.abs(dy + 0.05) < 0.12 && Math.abs(dx) < 0.6;
          // Neon glow background gradient
          const bg = (1 - (y / h)) * 0.4 + Math.sin(x * 0.02 + y * 0.01) * 0.1;

          let r = bg * 0.2 + head * 0.7;
          let g = bg * 0.1 + head * 0.2;
          let b = bg * 0.6 + head * 0.8;

          if (inVisor) {
            r = 1.0;
            g = 0.2 + Math.sin(x * 0.1) * 0.2;
            b = 0.4;
          }

          // Scanline lighting
          const scan = (Math.sin(y * 0.3) + 1) * 0.08;
          r += scan; g += scan; b += scan;

          px[idx]     = Math.min(255, Math.max(0, Math.floor(r * 255)));
          px[idx + 1] = Math.min(255, Math.max(0, Math.floor(g * 255)));
          px[idx + 2] = Math.min(255, Math.max(0, Math.floor(b * 255)));
          px[idx + 3] = 255;
        }
      }
      return data;
    }
  },
  {
    id: 'retro_synthwave',
    name: 'Synthwave Sun & Grid',
    category: 'Landscape',
    generate: (w: number, h: number) => {
      const data = new ImageData(w, h);
      const px = data.data;
      const horizon = h * 0.55;
      const sunX = w * 0.5, sunY = horizon - h * 0.12;
      const sunR = Math.min(w, h) * 0.24;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let r = 0, g = 0, b = 0;

          if (y < horizon) {
            // Sky gradient: purple to orange
            const t = y / horizon;
            r = 0.15 + t * 0.75;
            g = 0.05 + t * 0.25;
            b = 0.35 - t * 0.2;

            // Sun circle with Venetian blinds
            const dx = x - sunX, dy = y - sunY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < sunR) {
              const blind = Math.floor((y - (sunY - sunR)) / (sunR * 0.12));
              const gap = (y - (sunY - sunR)) % (sunR * 0.12);
              if (gap > sunR * 0.03 || y < sunY) {
                const sunT = (y - (sunY - sunR)) / (sunR * 2);
                r = 1.0;
                g = 0.85 - sunT * 0.6;
                b = 0.1;
              }
            }
          } else {
            // Perspective grid floor
            const depth = (y - horizon) / (h - horizon);
            const gridZ = 1.0 / (depth + 0.001);
            const gridX = (x - w * 0.5) * gridZ * 0.015;
            const lineX = Math.abs(gridX - Math.round(gridX));
            const lineZ = Math.abs(gridZ * 0.5 - Math.round(gridZ * 0.5));

            const isGrid = lineX < 0.08 || lineZ < 0.15;
            if (isGrid) {
              r = 0.1; g = 0.9; b = 1.0;
            } else {
              r = 0.08 * depth; g = 0.02 * depth; b = 0.2 * depth;
            }
          }

          px[idx]     = Math.min(255, Math.max(0, Math.floor(r * 255)));
          px[idx + 1] = Math.min(255, Math.max(0, Math.floor(g * 255)));
          px[idx + 2] = Math.min(255, Math.max(0, Math.floor(b * 255)));
          px[idx + 3] = 255;
        }
      }
      return data;
    }
  },
  {
    id: 'marble_statue',
    name: 'Classical Statue Bust',
    category: 'Sculpture & Tone',
    generate: (w: number, h: number) => {
      const data = new ImageData(w, h);
      const px = data.data;
      const cx = w * 0.5, cy = h * 0.5;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const nx = (x - cx) / (w * 0.35);
          const ny = (y - cy) / (h * 0.4);
          const rSq = nx * nx + ny * ny;

          // Sphere / Torso volume
          let val = 0.1;
          if (rSq < 1.0) {
            const nz = Math.sqrt(1.0 - rSq);
            // Key light from top-left
            const lx = -0.6, ly = -0.6, lz = 0.52;
            const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
            // Ambient + Chiaroscuro
            val = 0.15 + diff * 0.75 + Math.pow(diff, 12) * 0.4;
            // Carved ripples
            val += Math.sin(nx * 12 + ny * 6) * 0.08;
          }

          val = Math.min(1, Math.max(0, val));
          px[idx]     = Math.floor(val * 240);
          px[idx + 1] = Math.floor(val * 242);
          px[idx + 2] = Math.floor(val * 250);
          px[idx + 3] = 255;
        }
      }
      return data;
    }
  },
  {
    id: 'geometric_shapes',
    name: 'Brutalist Geometric Composition',
    category: 'Abstract & High Contrast',
    generate: (w: number, h: number) => {
      const data = new ImageData(w, h);
      const px = data.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          // Smooth radial gradient circle + stepped angle wedges + rectangular bars
          const dx = x - w * 0.4, dy = y - h * 0.45;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          let v = (x / w) * 0.4 + (y / h) * 0.2;
          if (dist < Math.min(w, h) * 0.28) {
            v = 0.5 + 0.5 * Math.sin(angle * 6 + dist * 0.05);
          }
          if (Math.abs(x - w * 0.65) < w * 0.12 && Math.abs(y - h * 0.6) < h * 0.25) {
            v = 1.0 - v;
          }

          px[idx]     = Math.floor(v * 255);
          px[idx + 1] = Math.floor(v * 255);
          px[idx + 2] = Math.floor(v * 255);
          px[idx + 3] = 255;
        }
      }
      return data;
    }
  }
];
