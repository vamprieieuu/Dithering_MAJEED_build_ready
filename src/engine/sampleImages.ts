export interface SampleImage {
  id: string;
  name: string;
  category: string;
  generate: (canvas: HTMLCanvasElement) => void;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sculpture',
    name: 'Classical Bust',
    category: 'Sculpture & Art',
    generate: (canvas) => {
      canvas.width = 600;
      canvas.height = 700;
      const ctx = canvas.getContext('2d')!;

      // Deep dramatic background
      const bgGrad = ctx.createRadialGradient(250, 250, 50, 300, 350, 450);
      bgGrad.addColorStop(0, '#2d3340');
      bgGrad.addColorStop(0.5, '#13161c');
      bgGrad.addColorStop(1, '#050608');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 600, 700);

      // Pedestal
      ctx.fillStyle = '#222630';
      ctx.fillRect(180, 560, 240, 100);
      ctx.fillStyle = '#3a4254';
      ctx.fillRect(160, 630, 280, 30);

      // Sculptural head form
      ctx.save();
      ctx.translate(300, 320);

      // Torso / shoulders
      const torsoGrad = ctx.createLinearGradient(-150, 100, 150, 300);
      torsoGrad.addColorStop(0, '#8d99ae');
      torsoGrad.addColorStop(0.5, '#4a5568');
      torsoGrad.addColorStop(1, '#1a202c');
      ctx.fillStyle = torsoGrad;
      ctx.beginPath();
      ctx.moveTo(-160, 240);
      ctx.bezierCurveTo(-140, 150, -80, 120, 0, 130);
      ctx.bezierCurveTo(80, 120, 140, 150, 160, 240);
      ctx.closePath();
      ctx.fill();

      // Neck
      const neckGrad = ctx.createLinearGradient(-40, 40, 50, 120);
      neckGrad.addColorStop(0, '#e2e8f0');
      neckGrad.addColorStop(0.6, '#718096');
      neckGrad.addColorStop(1, '#2d3748');
      ctx.fillStyle = neckGrad;
      ctx.fillRect(-35, 40, 70, 90);

      // Head oval
      const headGrad = ctx.createRadialGradient(-30, -50, 20, 0, -20, 140);
      headGrad.addColorStop(0, '#ffffff');
      headGrad.addColorStop(0.4, '#cbd5e1');
      headGrad.addColorStop(0.7, '#64748b');
      headGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -30, 85, 115, 0, 0, Math.PI * 2);
      ctx.fill();

      // Facial features & nose ridge
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-10, -50);
      ctx.lineTo(5, -10);
      ctx.lineTo(-12, 10);
      ctx.lineTo(-20, -10);
      ctx.closePath();
      ctx.fill();

      // Eye shadow cavities
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(-30, -35, 16, 9, -0.1, 0, Math.PI * 2);
      ctx.ellipse(25, -35, 16, 9, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Lips
      ctx.fillStyle = '#475569';
      ctx.fillRect(-18, 32, 36, 6);

      // Classical hair curls
      ctx.fillStyle = '#94a3b8';
      for (let a = -Math.PI; a <= 0; a += 0.28) {
        const hx = Math.cos(a) * 88;
        const hy = Math.sin(a) * 115 - 30;
        ctx.beginPath();
        ctx.arc(hx, hy, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Skyline',
    category: 'Vibrant & Neon',
    generate: (canvas) => {
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;

      // Neon synthwave sunset gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 420);
      skyGrad.addColorStop(0, '#0f051d');
      skyGrad.addColorStop(0.3, '#3b1254');
      skyGrad.addColorStop(0.6, '#9b1d6e');
      skyGrad.addColorStop(0.85, '#e03a3e');
      skyGrad.addColorStop(1, '#ffba08');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 600, 600);

      // Giant retro sun
      const sunGrad = ctx.createLinearGradient(300, 100, 300, 360);
      sunGrad.addColorStop(0, '#fff475');
      sunGrad.addColorStop(0.5, '#ff5964');
      sunGrad.addColorStop(1, '#9e0059');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(300, 240, 130, 0, Math.PI * 2);
      ctx.fill();

      // Sun horizontal Venetian blind cutouts
      ctx.fillStyle = '#3b1254';
      for (let y = 220; y < 370; y += 14) {
        const thickness = (y - 210) * 0.06;
        ctx.fillRect(150, y, 300, thickness);
      }

      // City buildings silhouettes
      ctx.fillStyle = '#0a0512';
      const buildings = [
        { x: 30, w: 70, h: 220 },
        { x: 90, w: 55, h: 280 },
        { x: 140, w: 85, h: 250 },
        { x: 220, w: 60, h: 330 },
        { x: 275, w: 90, h: 200 },
        { x: 360, w: 80, h: 310 },
        { x: 435, w: 65, h: 240 },
        { x: 495, w: 85, h: 270 },
      ];
      for (const b of buildings) {
        ctx.fillRect(b.x, 420 - b.h, b.w, b.h + 200);
      }

      // Lit neon windows
      ctx.fillStyle = '#00f5d4';
      for (const b of buildings) {
        for (let wy = 420 - b.h + 20; wy < 400; wy += 22) {
          for (let wx = b.x + 8; wx < b.x + b.w - 12; wx += 14) {
            if (Math.random() > 0.4) {
              ctx.fillRect(wx, wy, 6, 8);
            }
          }
        }
      }

      // Grid perspective floor
      ctx.fillStyle = '#05020a';
      ctx.fillRect(0, 420, 600, 180);
      ctx.strokeStyle = '#f72585';
      ctx.lineWidth = 1.5;
      // Horizon line
      ctx.beginPath();
      ctx.moveTo(0, 420);
      ctx.lineTo(600, 420);
      ctx.stroke();

      // Vanishing lines
      for (let x = -200; x <= 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(300, 420);
        ctx.lineTo(x, 600);
        ctx.stroke();
      }
      // Horizontal perspective rungs
      for (let y = 425; y < 600; y += (y - 410) * 0.45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(600, y);
        ctx.stroke();
      }
    }
  },
  {
    id: 'geometric',
    name: 'Gradient Sphere & Test Chart',
    category: 'Calibration & Test',
    generate: (canvas) => {
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;

      // Neutral gray background
      ctx.fillStyle = '#1e2229';
      ctx.fillRect(0, 0, 600, 600);

      // Central smooth continuous gradient sphere
      const sphereGrad = ctx.createRadialGradient(240, 230, 20, 300, 300, 190);
      sphereGrad.addColorStop(0, '#ffffff');
      sphereGrad.addColorStop(0.3, '#d1d5db');
      sphereGrad.addColorStop(0.65, '#4b5563');
      sphereGrad.addColorStop(0.9, '#111827');
      sphereGrad.addColorStop(1, '#030712');

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(300, 300, 180, 0, Math.PI * 2);
      ctx.fill();

      // Top tonal ramp bar (0% to 100% white)
      const topRamp = ctx.createLinearGradient(50, 0, 550, 0);
      topRamp.addColorStop(0, '#000000');
      topRamp.addColorStop(1, '#ffffff');
      ctx.fillStyle = topRamp;
      ctx.fillRect(50, 35, 500, 35);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(50, 35, 500, 35);

      // Bottom stepped grayscale blocks
      const steps = 10;
      const stepW = 500 / steps;
      for (let i = 0; i < steps; i++) {
        const val = Math.round((i / (steps - 1)) * 255);
        ctx.fillStyle = `rgb(${val},${val},${val})`;
        ctx.fillRect(50 + i * stepW, 530, stepW, 35);
      }
      ctx.strokeRect(50, 530, 500, 35);
    }
  },
  {
    id: 'botanical',
    name: 'Vintage Botanical Rose',
    category: 'Engraving & Print',
    generate: (canvas) => {
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;

      // Aged parchment background
      ctx.fillStyle = '#f4ede2';
      ctx.fillRect(0, 0, 600, 600);

      ctx.save();
      ctx.translate(300, 300);

      // Concentric petal spirals
      for (let r = 160; r > 10; r -= 18) {
        const petals = Math.floor(r / 12) + 4;
        const colorVal = Math.round(30 + (160 - r) * 1.1);
        ctx.fillStyle = `rgb(${colorVal + 50}, ${colorVal + 15}, ${colorVal + 25})`;

        for (let i = 0; i < petals; i++) {
          const a = (i / petals) * Math.PI * 2 + (r * 0.08);
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          ctx.beginPath();
          ctx.arc(px, py, r * 0.38, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#26171b';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Leaves
      ctx.fillStyle = '#3f5637';
      ctx.strokeStyle = '#182414';
      ctx.lineWidth = 1.5;
      const drawLeaf = (lx: number, ly: number, rot: number) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, 70, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-60, 0);
        ctx.lineTo(60, 0);
        ctx.stroke();
        ctx.restore();
      };

      drawLeaf(-170, 130, -0.6);
      drawLeaf(170, 120, 0.5);
      drawLeaf(-140, -140, -2.2);

      ctx.restore();
    }
  }
];
