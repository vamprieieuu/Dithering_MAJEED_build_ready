import { DitherParams, FloatImage, createFloatImage, LinesColorMode, LinesEdgeDir, LinesParams } from './core';

export interface SampleScene {
  id: string;
  name: string;
  subtitle: string;
  render: (w: number, h: number) => FloatImage;
}

export interface StudioPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  dither: Partial<DitherParams>;
  lines: Partial<LinesParams>;
}

export const DEFAULT_DITHER: DitherParams = {
  algo: 16, // Bayer 4x4
  mode: 1, // Monochrome B&W
  levels: 2,
  size: 1,
  threshold: 50,
  amount: 100,
  whiteAmount: 100,
  blackAmount: 100,
  strength: 100,
  contrast: 100,
  brightness: 0,
  serpentine: true,
  linear: false,
  invert: false,
  pixelate: false,
  animate: false,
  patternScale: 100,
  patternAngle: 0,
  noise: 0,
  seed: 0,
  dark: { r: 0.04, g: 0.04, b: 0.05 },
  mid: { r: 0.85, g: 0.32, b: 0.16 },
  light: { r: 0.96, g: 0.95, b: 0.91 },
};

export const DEFAULT_LINES: LinesParams = {
  enabled: true,
  amount: 600,
  length: 50,
  lengthRand: 40,
  width: 1.0,
  widthRand: 30,
  angle: 0,
  angleRand: 180,
  colorMode: LinesColorMode.LCM_SINGLE,
  color: { r: 1, g: 1, b: 1 },
  opacity: 90,
  objectMode: true,
  edgeThreshold: 25,
  edgeSensitivity: 75,
  edgeDirection: LinesEdgeDir.LED_ALONG,
  edgeOffset: 0.0,
  handMade: true,
  curve: 30,
  duplicate: false,
  duplicateCount: 1,
  duplicateOffset: 2.5,
  duplicateLength: 90,
  duplicateWidth: 0.8,
  duplicateOpacity: 75,
  autoAnim: true,
  motionAmount: 25,
  motionSpeed: 100,
  motionRand: 50,
  seed: 1,
};

export const STUDIO_PRESETS: StudioPreset[] = [
  {
    id: 'ae-default',
    name: 'AE Default (Bayer 4x4 + Contours)',
    badge: 'DEFAULT',
    description: 'Exact initial state of YMDithers.aex: Bayer 4x4 Monochrome with Canny object-following hand-made lines.',
    dither: { ...DEFAULT_DITHER },
    lines: { ...DEFAULT_LINES },
  },
  {
    id: 'xerox-contour',
    name: 'Xerox Zine + Duplicate Contours',
    badge: 'XEROX',
    description: 'Photocopy toner edge boost (Xerox Grain) paired with double parallel hand-made contour strokes.',
    dither: {
      algo: 14, // Xerox Grain
      mode: 2, // Duo-Tone
      levels: 2,
      size: 1,
      threshold: 48,
      strength: 115,
      contrast: 120,
      dark: { r: 0.06, g: 0.05, b: 0.07 },
      light: { r: 0.93, g: 0.90, b: 0.83 },
    },
    lines: {
      enabled: true,
      objectMode: true,
      handMade: true,
      curve: 45,
      duplicate: true,
      duplicateCount: 2,
      duplicateOffset: 3.0,
      amount: 750,
      length: 65,
      width: 1.2,
      colorMode: LinesColorMode.LCM_SINGLE,
      color: { r: 0.95, g: 0.26, b: 0.18 },
      opacity: 92,
    },
  },
  {
    id: 'halftone-press',
    name: 'Newspaper Halftone 45°',
    badge: 'SCREEN',
    description: 'Continuous 45° round-dot halftone screen evaluated at full resolution with zero block artifacts.',
    dither: {
      algo: 24, // Halftone 45
      mode: 1,
      levels: 2,
      size: 1.2,
      patternScale: 95,
      threshold: 50,
      strength: 105,
      contrast: 115,
    },
    lines: {
      enabled: false,
    },
  },
  {
    id: 'cmyk-rosette',
    name: 'CMYK Angled Print Separation',
    badge: 'CMYK',
    description: '4-channel CMYK halftone separation with traditional 15°/75°/0°/45° screen angles.',
    dither: {
      algo: 22, // Halftone
      mode: 3, // CMYK Halftone Separation
      levels: 2,
      size: 1.1,
      patternScale: 85,
      contrast: 115,
      strength: 100,
    },
    lines: {
      enabled: true,
      objectMode: true,
      amount: 450,
      width: 0.9,
      colorMode: LinesColorMode.LCM_SINGLE,
      color: { r: 0.08, g: 0.08, b: 0.1 },
      opacity: 75,
    },
  },
  {
    id: 'cyber-matrix',
    name: 'Cyber Octagonal Tri-Tone',
    badge: 'CYBER',
    description: 'Octagonal tech-cell matrix screen with Tonal Tri-Tone Ramp and neon contour tracing.',
    dither: {
      algo: 37, // Cyber
      mode: 4, // Tri-Tone Ramp
      levels: 3,
      size: 1.2,
      patternScale: 100,
      contrast: 125,
      dark: { r: 0.03, g: 0.05, b: 0.11 },
      mid: { r: 0.0, g: 0.58, b: 0.75 },
      light: { r: 0.78, g: 0.99, b: 0.85 },
    },
    lines: {
      enabled: true,
      objectMode: true,
      handMade: false,
      duplicate: true,
      duplicateCount: 1,
      duplicateOffset: 2.5,
      amount: 650,
      width: 1.0,
      colorMode: LinesColorMode.LCM_SINGLE,
      color: { r: 0.35, g: 1.0, b: 0.82 },
      opacity: 85,
    },
  },
  {
    id: 'atkinson-etch',
    name: 'Atkinson Hyper-Crisp + Woodcut',
    badge: 'DIFFUSION',
    description: 'Classic Macintosh 6/8 error diffusion with sparse white dot density gating and procedural strands.',
    dither: {
      algo: 4, // Atkinson
      mode: 1,
      levels: 2,
      size: 1,
      amount: 100,
      whiteAmount: 85,
      blackAmount: 100,
      contrast: 130,
    },
    lines: {
      enabled: true,
      objectMode: true,
      handMade: true,
      curve: 55,
      duplicate: false,
      amount: 900,
      length: 55,
      width: 1.1,
      color: { r: 1, g: 1, b: 1 },
      opacity: 95,
    },
  },
  {
    id: 'bytewav-fm',
    name: 'Bytewav FM Scanline Synth',
    badge: 'MODULATION',
    description: 'FM sine-wave line modulation screen with Preserve RGB color mode and sampled edge strands.',
    dither: {
      algo: 41, // Bytewav
      mode: 0, // Preserve RGB
      levels: 3,
      size: 1.1,
      patternScale: 90,
      contrast: 120,
    },
    lines: {
      enabled: true,
      objectMode: true,
      handMade: true,
      curve: 25,
      colorMode: LinesColorMode.LCM_SAMPLED,
      amount: 700,
      width: 1.3,
      opacity: 90,
    },
  },
];

// Procedural high-contrast studio test scenes rendered via HTML5 Canvas -> FloatImage
function canvasToFloatImage(canvas: HTMLCanvasElement): FloatImage {
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const out = createFloatImage(canvas.width, canvas.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    out.px[i] = d[i] / 255;
    out.px[i + 1] = d[i + 1] / 255;
    out.px[i + 2] = d[i + 2] / 255;
    out.px[i + 3] = d[i + 3] / 255;
  }
  return out;
}

export const SAMPLE_SCENES: SampleScene[] = [
  {
    id: 'sculpted-bust',
    name: 'Classical Bust & Halo',
    subtitle: 'Smooth gradients + crisp silhouette contours',
    render: (w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      // Deep dramatic studio backdrop
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.05, w * 0.5, h * 0.5, w * 0.7);
      bg.addColorStop(0, '#3a4252');
      bg.addColorStop(0.55, '#171a21');
      bg.addColorStop(1, '#08090c');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Sunburst halo ring behind head
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, w * 0.28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, w * 0.33, 0, Math.PI * 2);
      ctx.stroke();

      // Shoulders / Pedestal
      const shGrad = ctx.createLinearGradient(w * 0.2, h * 0.6, w * 0.8, h * 0.95);
      shGrad.addColorStop(0, '#f3f4f6');
      shGrad.addColorStop(0.45, '#9ca3af');
      shGrad.addColorStop(1, '#1f2937');
      ctx.fillStyle = shGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.16, h * 0.96);
      ctx.quadraticCurveTo(w * 0.22, h * 0.65, w * 0.42, h * 0.62);
      ctx.lineTo(w * 0.58, h * 0.62);
      ctx.quadraticCurveTo(w * 0.78, h * 0.65, w * 0.84, h * 0.96);
      ctx.closePath();
      ctx.fill();

      // Neck cylinder
      const neckGrad = ctx.createLinearGradient(w * 0.4, h * 0.5, w * 0.6, h * 0.65);
      neckGrad.addColorStop(0, '#e5e7eb');
      neckGrad.addColorStop(0.6, '#6b7280');
      neckGrad.addColorStop(1, '#1f2937');
      ctx.fillStyle = neckGrad;
      ctx.fillRect(w * 0.42, h * 0.48, w * 0.16, h * 0.17);

      // Head cranium & jaw
      const headGrad = ctx.createRadialGradient(
        w * 0.43,
        h * 0.31,
        w * 0.02,
        w * 0.5,
        h * 0.38,
        w * 0.22
      );
      headGrad.addColorStop(0, '#ffffff');
      headGrad.addColorStop(0.38, '#d1d5db');
      headGrad.addColorStop(0.72, '#4b5563');
      headGrad.addColorStop(1, '#111827');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.37, w * 0.16, h * 0.21, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sculpted eye sockets, nose bridge, and cheek planes
      ctx.fillStyle = 'rgba(17, 24, 39, 0.65)';
      ctx.beginPath();
      ctx.ellipse(w * 0.44, h * 0.35, w * 0.035, h * 0.018, -0.1, 0, Math.PI * 2);
      ctx.ellipse(w * 0.56, h * 0.35, w * 0.035, h * 0.018, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Nose bridge highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.32);
      ctx.lineTo(w * 0.49, h * 0.43);
      ctx.lineTo(w * 0.52, h * 0.44);
      ctx.stroke();

      // Lips shadow
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.49);
      ctx.quadraticCurveTo(w * 0.5, h * 0.505, w * 0.55, h * 0.49);
      ctx.stroke();

      // High-contrast geometric accents
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(w * 0.24, h * 0.24, w * 0.055, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.68, h * 0.18, w * 0.14, h * 0.14);

      return canvasToFloatImage(c);
    },
  },
  {
    id: 'optical-spheres',
    name: 'Chromatic Spheres & Grid',
    subtitle: 'Ideal for CMYK Halftone & RGB Diffusion',
    render: (w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(0.5, '#1e1b4b');
      bg.addColorStop(1, '#090d16');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Perspective grid lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = 1.5;
      const step = Math.round(w / 10);
      for (let x = step; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = step; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const drawSphere = (
        cx: number,
        cy: number,
        r: number,
        cLight: string,
        cMid: string,
        cDark: string
      ) => {
        const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.05, cx, cy, r);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.22, cLight);
        g.addColorStop(0.65, cMid);
        g.addColorStop(1, cDark);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      };

      drawSphere(w * 0.34, h * 0.42, w * 0.22, '#fb7185', '#e11d48', '#4c0519');
      drawSphere(w * 0.67, h * 0.38, w * 0.17, '#38bdf8', '#0284c7', '#082f49');
      drawSphere(w * 0.54, h * 0.71, w * 0.15, '#fde047', '#ca8a04', '#422006');

      // Continuous grayscale ramp bar at bottom
      const rampY = h * 0.89;
      const rampH = h * 0.07;
      const ramp = ctx.createLinearGradient(w * 0.08, 0, w * 0.92, 0);
      ramp.addColorStop(0, '#000000');
      ramp.addColorStop(1, '#ffffff');
      ctx.fillStyle = ramp;
      ctx.fillRect(w * 0.08, rampY, w * 0.84, rampH);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(w * 0.08, rampY, w * 0.84, rampH);

      return canvasToFloatImage(c);
    },
  },
  {
    id: 'brutalist-poster',
    name: 'Brutalist Typography & Rings',
    subtitle: 'Sharp typographic edges for Canny contour tracing',
    render: (w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;

      ctx.fillStyle = '#121316';
      ctx.fillRect(0, 0, w, h);

      // Diagonal gradient card
      const grad = ctx.createLinearGradient(w * 0.1, h * 0.1, w * 0.9, h * 0.9);
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(0.5, '#a855f7');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.52);

      // Concentric target rings
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffffff';
      for (let r = 24; r <= 120; r += 28) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.34, r * (w / 520), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Bold typography
      ctx.fillStyle = '#f8fafc';
      ctx.font = `900 ${Math.round(w * 0.14)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('DITHER', w * 0.5, h * 0.77);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `600 ${Math.round(w * 0.05)}px "JetBrains Mono", monospace`;
      ctx.fillText('49 ALGORITHMS // CANNY NMS', w * 0.5, h * 0.86);

      return canvasToFloatImage(c);
    },
  },
];
