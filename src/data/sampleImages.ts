export interface SampleImage {
  id: string;
  name: string;
  category: string;
  generate: (width: number, height: number) => ImageData;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'cyber-portrait',
    name: 'Cyber Portrait',
    category: 'Portrait',
    generate: (w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#0d1117');
      bgGrad.addColorStop(0.5, '#1e2430');
      bgGrad.addColorStop(1, '#05070a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const cx = w * 0.5;
      const cy = h * 0.45;

      // Rim glow / back light
      const rim = ctx.createRadialGradient(cx - 30, cy - 40, 20, cx, cy, 260);
      rim.addColorStop(0, '#ff3e7f');
      rim.addColorStop(0.4, '#00d2ff');
      rim.addColorStop(0.8, 'rgba(0, 210, 255, 0)');
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, 260, 0, Math.PI * 2);
      ctx.fill();

      // Head silhouette / form
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, 110, 150, 0, 0, Math.PI * 2);
      const faceGrad = ctx.createLinearGradient(cx - 80, cy - 100, cx + 80, cy + 100);
      faceGrad.addColorStop(0, '#fcefe8');
      faceGrad.addColorStop(0.4, '#e0987a');
      faceGrad.addColorStop(0.7, '#853e34');
      faceGrad.addColorStop(1, '#1b121e');
      ctx.fillStyle = faceGrad;
      ctx.fill();

      // Cyber Visor / Glasses
      ctx.fillStyle = '#0ff';
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(cx - 95, cy - 25, 190, 42, 8);
      ctx.fill();

      // Visor gradient overlay
      ctx.shadowBlur = 0;
      const visorGrad = ctx.createLinearGradient(cx - 90, cy, cx + 90, cy);
      visorGrad.addColorStop(0, 'rgba(255, 0, 128, 0.9)');
      visorGrad.addColorStop(0.5, 'rgba(0, 255, 234, 0.9)');
      visorGrad.addColorStop(1, 'rgba(255, 230, 0, 0.9)');
      ctx.fillStyle = visorGrad;
      ctx.fillRect(cx - 90, cy - 20, 180, 32);

      // Cheek & jaw contour
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 60, 70, 70, 0, 0, Math.PI);
      ctx.fill();

      // Neck & collar
      ctx.fillStyle = '#11141c';
      ctx.beginPath();
      ctx.moveTo(cx - 60, cy + 130);
      ctx.lineTo(cx - 140, h);
      ctx.lineTo(cx + 140, h);
      ctx.lineTo(cx + 60, cy + 130);
      ctx.closePath();
      ctx.fill();

      // High-contrast neck highlight
      const neckGrad = ctx.createLinearGradient(cx - 50, cy + 130, cx + 50, cy + 180);
      neckGrad.addColorStop(0, '#e0987a');
      neckGrad.addColorStop(0.5, '#402028');
      neckGrad.addColorStop(1, '#0b0c10');
      ctx.fillStyle = neckGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 45, cy + 130);
      ctx.lineTo(cx - 55, cy + 220);
      ctx.lineTo(cx + 55, cy + 220);
      ctx.lineTo(cx + 45, cy + 130);
      ctx.closePath();
      ctx.fill();

      // Circular graphic halo
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy - 30, 190, 0.2, 1.4);
      ctx.stroke();

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 30, 210, 2.0, 3.8);
      ctx.stroke();

      ctx.restore();
      return ctx.getImageData(0, 0, w, h);
    }
  },
  {
    id: 'classical-statue',
    name: 'Classical Statue Bust',
    category: 'Sculpture',
    generate: (w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dark studio background
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, w, h);

      // Chiaroscuro key light
      const keyLight = ctx.createRadialGradient(w * 0.35, h * 0.25, 40, w * 0.45, h * 0.45, 320);
      keyLight.addColorStop(0, '#2e3038');
      keyLight.addColorStop(0.7, '#131418');
      keyLight.addColorStop(1, '#0a0a0c');
      ctx.fillStyle = keyLight;
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.45;

      // Marble Head with directional lighting
      ctx.save();
      const marbleGrad = ctx.createLinearGradient(cx - 120, cy - 120, cx + 120, cy + 120);
      marbleGrad.addColorStop(0, '#ffffff');
      marbleGrad.addColorStop(0.3, '#dcdde2');
      marbleGrad.addColorStop(0.65, '#5a5c64');
      marbleGrad.addColorStop(1, '#111215');

      ctx.fillStyle = marbleGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 20, 105, 140, -0.08, 0, Math.PI * 2);
      ctx.fill();

      // Hair ringlets texture
      ctx.fillStyle = '#f0f1f5';
      for (let angle = 0; angle < Math.PI; angle += 0.25) {
        const rx = cx + Math.cos(angle + Math.PI) * 110;
        const ry = (cy - 70) + Math.sin(angle + Math.PI) * 80;
        ctx.beginPath();
        ctx.arc(rx, ry, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      // Deep eye sockets & shadow side
      ctx.fillStyle = '#1c1d22';
      ctx.beginPath();
      ctx.ellipse(cx + 35, cy - 35, 24, 16, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Lit eye socket
      ctx.fillStyle = '#5c5e68';
      ctx.beginPath();
      ctx.ellipse(cx - 35, cy - 35, 22, 14, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Classical straight nose bridge & cast shadow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 38);
      ctx.lineTo(cx - 16, cy + 20);
      ctx.lineTo(cx + 6, cy + 22);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#22232a';
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy + 22);
      ctx.lineTo(cx + 25, cy + 25);
      ctx.lineTo(cx + 12, cy - 30);
      ctx.closePath();
      ctx.fill();

      // Lips
      ctx.fillStyle = '#454750';
      ctx.beginPath();
      ctx.ellipse(cx - 5, cy + 55, 25, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Classical bust base / draped pedestal
      ctx.fillStyle = '#3a3c44';
      ctx.beginPath();
      ctx.moveTo(cx - 90, cy + 150);
      ctx.bezierCurveTo(cx - 150, cy + 220, cx - 180, h - 20, cx - 180, h);
      ctx.lineTo(cx + 180, h);
      ctx.bezierCurveTo(cx + 180, h - 20, cx + 150, cy + 220, cx + 90, cy + 150);
      ctx.closePath();
      ctx.fill();

      // Drapery folds
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 130, cy + 230);
      ctx.quadraticCurveTo(cx, cy + 280, cx + 130, cy + 210);
      ctx.stroke();

      ctx.strokeStyle = '#18191f';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(cx - 110, cy + 255);
      ctx.quadraticCurveTo(cx + 10, cy + 305, cx + 140, cy + 235);
      ctx.stroke();

      ctx.restore();
      return ctx.getImageData(0, 0, w, h);
    }
  },
  {
    id: 'cyber-architecture',
    name: 'Cyberpunk Metropolis',
    category: 'Architecture',
    generate: (w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Neon sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0a0017');
      sky.addColorStop(0.4, '#240638');
      sky.addColorStop(0.7, '#6b114d');
      sky.addColorStop(1, '#1a0026');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Distant retro glowing sun
      const sun = ctx.createRadialGradient(w * 0.5, h * 0.55, 10, w * 0.5, h * 0.55, 140);
      sun.addColorStop(0, '#fffb00');
      sun.addColorStop(0.6, '#ff0055');
      sun.addColorStop(1, 'rgba(255, 0, 85, 0)');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.55, 130, 0, Math.PI * 2);
      ctx.fill();

      // Synthwave horizontal sun blinds
      ctx.fillStyle = '#240638';
      for (let y = h * 0.48; y < h * 0.65; y += 12) {
        ctx.fillRect(w * 0.35, y, w * 0.3, 4);
      }

      // Skyscraper silhouettes
      const buildings = [
        { x: 30,  w: 70,  h: 300, col: '#0d0414', winCol: '#00ffff' },
        { x: 120, w: 90,  h: 390, col: '#160824', winCol: '#ff007f' },
        { x: 230, w: 110, h: 460, col: '#0a0210', winCol: '#ffe600' },
        { x: 360, w: 85,  h: 350, col: '#190a28', winCol: '#00ffff' },
        { x: 460, w: 100, h: 420, col: '#10041a', winCol: '#ff0055' },
        { x: 580, w: 80,  h: 310, col: '#090110', winCol: '#00ffcc' }
      ];

      for (const b of buildings) {
        const topY = h - b.h;
        ctx.fillStyle = b.col;
        ctx.fillRect(b.x, topY, b.w, b.h);

        // Antenna
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, topY);
        ctx.lineTo(b.x + b.w / 2, topY - 50);
        ctx.stroke();

        // Windows grid
        ctx.fillStyle = b.winCol;
        for (let wy = topY + 20; wy < h - 40; wy += 18) {
          for (let wx = b.x + 10; wx < b.x + b.w - 10; wx += 14) {
            if (Math.sin(wx * 11 + wy * 17) > 0.1) {
              ctx.fillRect(wx, wy, 6, 8);
            }
          }
        }
      }

      // Neon highway perspective grid at bottom
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      const groundY = h * 0.72;
      for (let x = -w; x <= w * 2; x += 60) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, groundY);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = groundY; y < h; y += (y - groundY) * 0.35 + 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      return ctx.getImageData(0, 0, w, h);
    }
  },
  {
    id: 'botanical-monstera',
    name: 'Botanical Leaf',
    category: 'Nature',
    generate: (w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Warm earthy paper background
      ctx.fillStyle = '#ede7d9';
      ctx.fillRect(0, 0, w, h);

      // Subtle paper grain
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      for (let i = 0; i < 4000; ++i) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }

      const cx = w * 0.5;
      const cy = h * 0.5;

      // Large Monstera leaf
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.15);

      const leafGrad = ctx.createLinearGradient(-150, -220, 150, 220);
      leafGrad.addColorStop(0, '#689f38');
      leafGrad.addColorStop(0.4, '#33691e');
      leafGrad.addColorStop(0.8, '#1b380f');
      leafGrad.addColorStop(1, '#0e1c07');

      ctx.fillStyle = leafGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 160, 240, 0, 0, Math.PI * 2);
      ctx.fill();

      // Leaf cuts / fenestrations (monstera holes)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      const cutHoles = [
        { x: -90, y: -100, rx: 25, ry: 70, rot: -0.6 },
        { x: -100, y: 10,  rx: 28, ry: 80, rot: -0.8 },
        { x: -80, y: 120, rx: 22, ry: 60, rot: -1.0 },
        { x: 90,  y: -90, rx: 25, ry: 70, rot: 0.6 },
        { x: 100, y: 20,  rx: 28, ry: 80, rot: 0.8 },
        { x: 80,  y: 130, rx: 22, ry: 60, rot: 1.0 },
      ];
      for (const hole of cutHoles) {
        ctx.beginPath();
        ctx.ellipse(hole.x, hole.y, hole.rx, hole.ry, hole.rot, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      // Central stem / vein
      ctx.strokeStyle = '#aed581';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(0, 260);
      ctx.quadraticCurveTo(5, 50, 0, -230);
      ctx.stroke();

      // Lateral veins
      ctx.lineWidth = 3;
      for (let y = -180; y <= 180; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(60, y - 20, 130, y - 35);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(-60, y - 20, -130, y - 35);
        ctx.stroke();
      }

      ctx.restore();
      return ctx.getImageData(0, 0, w, h);
    }
  }
];
