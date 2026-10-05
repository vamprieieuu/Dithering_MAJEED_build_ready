export interface SampleImage {
  id: string;
  name: string;
  category: string;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'classical-bust',
    name: 'Classical Sculpture & Lighting',
    category: 'Portraits & Statues',
    render: (ctx, w, h) => {
      // Dark museum background
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 50, w * 0.5, h * 0.5, w * 0.8);
      bgGrad.addColorStop(0, '#333742');
      bgGrad.addColorStop(0.5, '#1e2029');
      bgGrad.addColorStop(1, '#090a0d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Classical torso / bust silhouette with rich lighting
      ctx.save();
      // Head & Neck
      const headGrad = ctx.createRadialGradient(w * 0.42, h * 0.32, 10, w * 0.5, h * 0.4, w * 0.28);
      headGrad.addColorStop(0, '#ffffff');
      headGrad.addColorStop(0.3, '#d8dbe2');
      headGrad.addColorStop(0.65, '#5c6370');
      headGrad.addColorStop(1, '#1b1d24');

      ctx.fillStyle = headGrad;
      // Shoulders & Chest
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.72, w * 0.38, h * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.beginPath();
      ctx.rect(w * 0.42, h * 0.45, w * 0.16, h * 0.22);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.35, w * 0.18, h * 0.22, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Facial features & sculptured folds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(w * 0.45, h * 0.33, w * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // Dramatic rim light
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.35, w * 0.18, Math.PI * 0.7, Math.PI * 1.5);
      ctx.stroke();

      // Classical draped robes folds
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#22252e';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(w * (0.2 + i * 0.1), h * 0.65);
        ctx.bezierCurveTo(
          w * (0.25 + i * 0.08), h * 0.78,
          w * (0.3 + i * 0.06), h * 0.88,
          w * (0.35 + i * 0.05), h * 0.98
        );
        ctx.stroke();
      }

      ctx.restore();
    },
  },
  {
    id: 'cyberpunk-city',
    name: 'Cyberpunk Metropolis',
    category: 'Architecture & Sci-Fi',
    render: (ctx, w, h) => {
      // Deep night sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0d0221');
      skyGrad.addColorStop(0.5, '#240046');
      skyGrad.addColorStop(0.8, '#7b2cbf');
      skyGrad.addColorStop(1, '#ff007f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Giant neon moon/sun
      const moonGrad = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.35, w * 0.22);
      moonGrad.addColorStop(0, '#ff9e00');
      moonGrad.addColorStop(0.6, '#ff007f');
      moonGrad.addColorStop(1, 'rgba(255, 0, 127, 0)');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.35, w * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Skyscraper silhouettes
      const buildings = [
        { x: 0.05, w: 0.12, h: 0.55 },
        { x: 0.18, w: 0.15, h: 0.7 },
        { x: 0.34, w: 0.18, h: 0.8 },
        { x: 0.53, w: 0.14, h: 0.65 },
        { x: 0.68, w: 0.16, h: 0.75 },
        { x: 0.85, w: 0.12, h: 0.5 },
      ];

      for (const b of buildings) {
        ctx.fillStyle = '#0f051d';
        ctx.fillRect(w * b.x, h * (1 - b.h), w * b.w, h * b.h);

        // Windows matrix
        const winW = 3;
        const winH = 4;
        for (let wy = h * (1 - b.h) + 10; wy < h - 20; wy += 9) {
          for (let wx = w * b.x + 6; wx < w * (b.x + b.w) - 6; wx += 8) {
            if (Math.random() > 0.4) {
              ctx.fillStyle = Math.random() > 0.3 ? '#00f5d4' : '#fee440';
              ctx.fillRect(wx, wy, winW, winH);
            }
          }
        }
      }

      // Neon grid perspective ground
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.4)';
      ctx.lineWidth = 1.5;
      const horizonY = h * 0.82;
      for (let x = -w * 0.5; x <= w * 1.5; x += w * 0.1) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, horizonY);
        ctx.lineTo(x * 1.8, h);
        ctx.stroke();
      }
      for (let y = horizonY; y < h; y += (h - y) * 0.3 + 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  },
  {
    id: 'synthwave-sunset',
    name: 'Synthwave 80s Sunset',
    category: 'Retro & Aesthetic',
    render: (ctx, w, h) => {
      // Sunset Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      skyGrad.addColorStop(0, '#10002b');
      skyGrad.addColorStop(0.4, '#3c096c');
      skyGrad.addColorStop(0.7, '#7b2cbf');
      skyGrad.addColorStop(1, '#ff6b6b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.65);

      // Segmented Retro Sun
      const sunY = h * 0.45;
      const sunR = w * 0.22;
      const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
      sunGrad.addColorStop(0, '#fff3b0');
      sunGrad.addColorStop(0.5, '#ff9e00');
      sunGrad.addColorStop(1, '#e01e37');

      ctx.save();
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Venetian blinds horizontal cuts through the sun
      ctx.fillStyle = '#10002b';
      for (let i = 0; i < 7; i++) {
        const cutY = sunY + (i / 7) * sunR;
        const cutH = 2 + i * 2;
        ctx.fillRect(w * 0.2, cutY, w * 0.6, cutH);
      }
      ctx.restore();

      // Neon wireframe mountains
      ctx.fillStyle = '#080114';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.lineTo(w * 0.2, h * 0.48);
      ctx.lineTo(w * 0.35, h * 0.62);
      ctx.lineTo(w * 0.55, h * 0.45);
      ctx.lineTo(w * 0.75, h * 0.58);
      ctx.lineTo(w, h * 0.5);
      ctx.lineTo(w, h * 0.65);
      ctx.closePath();
      ctx.fill();

      // Ocean floor
      ctx.fillStyle = '#030008';
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // Glowing grid
      ctx.strokeStyle = '#f72585';
      ctx.lineWidth = 1.5;
      for (let y = h * 0.65; y < h; y += Math.pow((y - h * 0.65) / 10, 1.4) + 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = 0; x <= w; x += w * 0.08) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.65);
        ctx.lineTo((x - w * 0.5) * 3 + w * 0.5, h);
        ctx.stroke();
      }
    },
  },
  {
    id: 'geometric-spheres',
    name: 'Test Halftone Spheres & Ramps',
    category: 'Gradients & Technical',
    render: (ctx, w, h) => {
      // Dark neutral background
      ctx.fillStyle = '#16161a';
      ctx.fillRect(0, 0, w, h);

      // Continuous linear gradient ramp (0 to 255)
      const ramp = ctx.createLinearGradient(w * 0.08, 0, w * 0.92, 0);
      ramp.addColorStop(0, '#000000');
      ramp.addColorStop(0.5, '#7f7f7f');
      ramp.addColorStop(1, '#ffffff');
      ctx.fillStyle = ramp;
      ctx.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.1);

      // 3D smooth lit shaded sphere (main test object for halftones)
      const sphereR = w * 0.22;
      const sphereX = w * 0.35;
      const sphereY = h * 0.55;
      const sphereGrad = ctx.createRadialGradient(
        sphereX - sphereR * 0.35,
        sphereY - sphereR * 0.35,
        sphereR * 0.05,
        sphereX,
        sphereY,
        sphereR
      );
      sphereGrad.addColorStop(0, '#ffffff');
      sphereGrad.addColorStop(0.2, '#d4d4d8');
      sphereGrad.addColorStop(0.55, '#71717a');
      sphereGrad.addColorStop(0.85, '#27272a');
      sphereGrad.addColorStop(1, '#09090b');

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2);
      ctx.fill();

      // Cone / Pyramid lighting
      ctx.save();
      const coneGrad = ctx.createLinearGradient(w * 0.65, h * 0.35, w * 0.85, h * 0.75);
      coneGrad.addColorStop(0, '#ffffff');
      coneGrad.addColorStop(0.4, '#a1a1aa');
      coneGrad.addColorStop(0.8, '#27272a');
      coneGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.75, h * 0.32);
      ctx.lineTo(w * 0.92, h * 0.78);
      ctx.lineTo(w * 0.58, h * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Stepped grayscale bar
      const steps = 10;
      const stepW = (w * 0.84) / steps;
      for (let s = 0; s < steps; s++) {
        const val = Math.round((s / (steps - 1)) * 255);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(w * 0.08 + s * stepW, h * 0.84, stepW, h * 0.07);
      }
    },
  },
  {
    id: 'botanical-leaf',
    name: 'Macro Botanical Monstera',
    category: 'Nature & Organic',
    render: (ctx, w, h) => {
      // Warm dark studio backdrop
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#1c1917');
      bg.addColorStop(1, '#0c0a09');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);

      // Large organic leaf
      const leafGrad = ctx.createRadialGradient(-w * 0.1, -h * 0.1, 20, 0, 0, w * 0.45);
      leafGrad.addColorStop(0, '#dcfce7');
      leafGrad.addColorStop(0.25, '#86efac');
      leafGrad.addColorStop(0.55, '#22c55e');
      leafGrad.addColorStop(0.8, '#15803d');
      leafGrad.addColorStop(1, '#052e16');
      ctx.fillStyle = leafGrad;

      ctx.beginPath();
      ctx.moveTo(0, -h * 0.42);
      ctx.bezierCurveTo(w * 0.4, -h * 0.35, w * 0.45, h * 0.15, 0, h * 0.42);
      ctx.bezierCurveTo(-w * 0.45, h * 0.15, -w * 0.4, -h * 0.35, 0, -h * 0.42);
      ctx.fill();

      // Leaf main stem vein
      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.42);
      ctx.lineTo(0, -h * 0.4);
      ctx.stroke();

      // Secondary lateral veins
      ctx.lineWidth = 2.5;
      for (let i = -6; i <= 6; i++) {
        const vy = (i / 7) * h * 0.35;
        ctx.beginPath();
        ctx.moveTo(0, vy);
        ctx.bezierCurveTo(w * 0.15, vy - 15, w * 0.25, vy + 5, w * 0.32, vy - 20);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, vy);
        ctx.bezierCurveTo(-w * 0.15, vy - 15, -w * 0.25, vy + 5, -w * 0.32, vy - 20);
        ctx.stroke();
      }

      ctx.restore();
    },
  },
];
