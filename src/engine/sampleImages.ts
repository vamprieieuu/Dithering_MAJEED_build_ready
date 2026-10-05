export interface SampleImage {
  id: string;
  name: string;
  generate: (canvas: HTMLCanvasElement) => void;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'cyberpunk-portrait',
    name: 'Cyberpunk Portrait',
    generate: (canvas) => {
      const ctx = canvas.getContext('2d')!;
      const w = canvas.width, h = canvas.height;
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#4338ca');
      grad.addColorStop(1, '#db2777');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Face silhouette
      ctx.fillStyle = '#fce7f3';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.45, w * 0.22, h * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.35, w * 0.26, Math.PI, Math.PI * 2);
      ctx.fill();

      // Sunglasses (high-contrast edges)
      ctx.fillStyle = '#18181b';
      ctx.fillRect(w * 0.34, h * 0.40, w * 0.14, h * 0.08);
      ctx.fillRect(w * 0.52, h * 0.40, w * 0.14, h * 0.08);
      ctx.fillRect(w * 0.46, h * 0.43, w * 0.08, h * 0.02);

      // Neon rim light
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.45, w * 0.22, Math.PI * 0.7, Math.PI * 1.3);
      ctx.stroke();

      // Torso
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.88, w * 0.35, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'retro-grid-sunset',
    name: '80s Synthwave Sunset',
    generate: (canvas) => {
      const ctx = canvas.getContext('2d')!;
      const w = canvas.width, h = canvas.height;
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, '#050515');
      sky.addColorStop(0.5, '#4c1d95');
      sky.addColorStop(1, '#f43f5e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.6);

      // Sun
      const sun = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.22);
      sun.addColorStop(0, '#fef08a');
      sun.addColorStop(0.6, '#f97316');
      sun.addColorStop(1, '#e11d48');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.4, w * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Sun horizontal stripes
      ctx.fillStyle = '#4c1d95';
      for (let i = 1; i <= 6; i++) {
        const y = h * 0.38 + i * 8;
        ctx.fillRect(w * 0.28, y, w * 0.44, i * 1.5);
      }

      // Mountains
      ctx.fillStyle = '#180a30';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.6);
      ctx.lineTo(w * 0.25, h * 0.45);
      ctx.lineTo(w * 0.5, h * 0.55);
      ctx.lineTo(w * 0.75, h * 0.48);
      ctx.lineTo(w, h * 0.6);
      ctx.fill();

      // Ground grid
      ctx.fillStyle = '#090518';
      ctx.fillRect(0, h * 0.6, w, h * 0.4);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      // Perspective lines
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5 + i * (w * 0.05), h * 0.6);
        ctx.lineTo(w * 0.5 + i * (w * 0.25), h);
        ctx.stroke();
      }
      // Horizontal grid lines
      for (let y = h * 0.6; y < h; y += (y - h * 0.55) * 0.28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  },
  {
    id: 'geometric-contrast',
    name: 'Geometric Contrast Study',
    generate: (canvas) => {
      const ctx = canvas.getContext('2d')!;
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, w, h);

      // Smooth grayscale gradient ramp
      const grad = ctx.createLinearGradient(w * 0.1, 0, w * 0.9, 0);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.5, '#888888');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.15);

      // Shapes with varying values
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.arc(w * 0.3, h * 0.5, w * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(w * 0.52, h * 0.36, w * 0.28, h * 0.28);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.9);
      ctx.lineTo(w * 0.5, h * 0.7);
      ctx.lineTo(w * 0.75, h * 0.9);
      ctx.closePath();
      ctx.fill();
    },
  },
];
