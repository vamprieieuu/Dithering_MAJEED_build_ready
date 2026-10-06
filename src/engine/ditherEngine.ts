// Dither Engine - 1:1 Mirror of native core/dither.cpp
// Produces 100% identical pixel processing between Web Preview and Native After Effects YMDithers.aex

export interface RGBPixel {
  r: number;
  g: number;
  b: number;
}

export interface DitherParams {
  enabled: boolean;
  algorithm: number;       // 1..49 (1-indexed matching AE popup)
  colorMode: number;       // 1 = Preserve, 2 = Monochrome, 3 = Strong Green, 4 = Volcanic, 5 = Strong Red, 6 = Game Boy, 7 = Cyberpunk, 8 = Amber CRT
  amount: number;          // 0..100%
  strength: number;        // -20..+20 (default 0)
  scale: number;           // 1..16 (default 1)
  threshold: number;       // 0..100% (default 50)
  contrast: number;        // 0..300% (default 100)
  brightness: number;      // -100..100% (default 0)
  randomness: number;      // 0..100% (default 0)
  patternScale: number;    // 25..400% (default 100)
  patternAngle: number;    // 0..360 deg (default 0)
  serpentine: boolean;     // default true
  linearGamma: boolean;    // default false
  seed: number;            // default 0
}

export const DITHER_PALETTES: { id: number; name: string; colors: RGBPixel[] }[] = [
  {
    id: 1,
    name: 'Preserve Original Colors',
    colors: [
      { r: 0, g: 0, b: 0 },
      { r: 1, g: 1, b: 1 }
    ]
  },
  {
    id: 2,
    name: 'Monochrome (B&W)',
    colors: [
      { r: 0.0, g: 0.0, b: 0.0 },
      { r: 1.0, g: 1.0, b: 1.0 }
    ]
  },
  {
    id: 3,
    name: 'Strong Green (Phosphor / Matrix)',
    colors: [
      { r: 0.02, g: 0.05, b: 0.02 },
      { r: 0.05, g: 0.35, b: 0.12 },
      { r: 0.00, g: 0.88, b: 0.30 },
      { r: 0.70, g: 1.00, b: 0.50 }
    ]
  },
  {
    id: 4,
    name: 'Volcanic / Lava',
    colors: [
      { r: 0.07, g: 0.03, b: 0.06 },
      { r: 0.60, g: 0.08, b: 0.08 },
      { r: 0.98, g: 0.44, b: 0.06 },
      { r: 1.00, g: 0.94, b: 0.52 }
    ]
  },
  {
    id: 5,
    name: 'Strong Red (Cyber Abyss)',
    colors: [
      { r: 0.04, g: 0.00, b: 0.02 },
      { r: 0.55, g: 0.04, b: 0.16 },
      { r: 1.00, g: 0.02, b: 0.16 },
      { r: 1.00, g: 0.86, b: 0.88 }
    ]
  },
  {
    id: 6,
    name: 'Game Boy Classic',
    colors: [
      { r: 0.06, g: 0.22, b: 0.06 },
      { r: 0.19, g: 0.38, b: 0.19 },
      { r: 0.55, g: 0.67, b: 0.06 },
      { r: 0.61, g: 0.74, b: 0.06 }
    ]
  },
  {
    id: 7,
    name: 'Cyberpunk Neon',
    colors: [
      { r: 0.02, g: 0.04, b: 0.12 },
      { r: 0.75, g: 0.05, b: 0.50 },
      { r: 0.00, g: 0.92, b: 0.88 },
      { r: 0.98, g: 0.98, b: 0.60 }
    ]
  },
  {
    id: 8,
    name: 'Amber CRT',
    colors: [
      { r: 0.10, g: 0.04, b: 0.01 },
      { r: 0.50, g: 0.22, b: 0.00 },
      { r: 0.90, g: 0.48, b: 0.10 },
      { r: 1.00, g: 0.86, b: 0.40 }
    ]
  }
];

export const DITHER_ALGORITHMS = [
  { id: 1, name: 'Floyd-Steinberg', category: 'Diffusion' },
  { id: 2, name: 'Floyd-Steinberg Serpentine', category: 'Diffusion' },
  { id: 3, name: 'Jarvis-Judice-Ninke', category: 'Diffusion' },
  { id: 4, name: 'Stucki', category: 'Diffusion' },
  { id: 5, name: 'Atkinson', category: 'Diffusion' },
  { id: 6, name: 'Burkes', category: 'Diffusion' },
  { id: 7, name: 'Sierra', category: 'Diffusion' },
  { id: 8, name: 'Sierra Two Row', category: 'Diffusion' },
  { id: 9, name: 'Sierra Lite', category: 'Diffusion' },
  { id: 10, name: 'Fan', category: 'Diffusion' },
  { id: 11, name: 'Shiau-Fan', category: 'Diffusion' },
  { id: 12, name: 'Skip Neighbours', category: 'Diffusion' },
  { id: 13, name: 'Skip1 Neighbours', category: 'Diffusion' },
  { id: 14, name: 'Skip2 Neighbours', category: 'Diffusion' },
  { id: 15, name: 'Xerox Grain', category: 'Diffusion' },
  { id: 16, name: 'Bayer 2x2', category: 'Ordered' },
  { id: 17, name: 'Bayer 4x4', category: 'Ordered' },
  { id: 18, name: 'Bayer 8x8', category: 'Ordered' },
  { id: 19, name: 'Bayer 16x16', category: 'Ordered' },
  { id: 20, name: 'Blue Noise', category: 'Noise' },
  { id: 21, name: 'Interleaved Gradient Noise', category: 'Noise' },
  { id: 22, name: 'White Noise', category: 'Noise' },
  { id: 23, name: 'Halftone', category: 'Halftone' },
  { id: 24, name: 'Halftone 22.5°', category: 'Halftone' },
  { id: 25, name: 'Halftone 45°', category: 'Halftone' },
  { id: 26, name: 'Matrix', category: 'Screen' },
  { id: 27, name: 'Square Halftone', category: 'Screen' },
  { id: 28, name: 'Mosaic Halftone', category: 'Screen' },
  { id: 29, name: 'Rekt Block', category: 'Screen' },
  { id: 30, name: 'Row Modulation', category: 'Modulation' },
  { id: 31, name: 'Medium Modulation', category: 'Modulation' },
  { id: 32, name: 'Heavy Modulation', category: 'Modulation' },
  { id: 33, name: 'Column Modulation', category: 'Modulation' },
  { id: 34, name: 'Tilt (+45 Engraving)', category: 'Screen' },
  { id: 35, name: 'Bitslash (-45)', category: 'Screen' },
  { id: 36, name: 'Variable Hatch', category: 'Screen' },
  { id: 37, name: 'Grid', category: 'Screen' },
  { id: 38, name: 'Cyber', category: 'Screen' },
  { id: 39, name: 'Cross Square', category: 'Screen' },
  { id: 40, name: 'Diamond', category: 'Screen' },
  { id: 41, name: 'Star', category: 'Screen' },
  { id: 42, name: 'Bytewav', category: 'Screen' },
  { id: 43, name: 'Z-Modulation', category: 'Screen' },
  { id: 44, name: 'Circuit', category: 'Screen' },
  { id: 45, name: 'Vertical Stitch', category: 'Screen' },
  { id: 46, name: 'Horizontal Stitch', category: 'Screen' },
  { id: 47, name: 'Clock', category: 'Screen' },
  { id: 48, name: 'Bi-thread', category: 'Screen' },
  { id: 49, name: 'Knit', category: 'Screen' },
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function luma709(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hash3(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1274126177) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function u01(h: number): number {
  return (h >>> 0) / 4294967296.0;
}

const BAYER2 = [
  [0 / 4, 2 / 4],
  [3 / 4, 1 / 4]
];

const BAYER4 = [
  [ 0 / 16,  8 / 16,  2 / 16, 10 / 16],
  [12 / 16,  4 / 16, 14 / 16,  6 / 16],
  [ 3 / 16, 11 / 16,  1 / 16,  9 / 16],
  [15 / 16,  7 / 16, 13 / 16,  5 / 16]
];

const BAYER8 = [
  [ 0/64, 32/64,  8/64, 40/64,  2/64, 34/64, 10/64, 42/64],
  [48/64, 16/64, 56/64, 24/64, 50/64, 18/64, 58/64, 26/64],
  [12/64, 44/64,  4/64, 36/64, 14/64, 46/64,  6/64, 38/64],
  [60/64, 28/64, 52/64, 20/64, 62/64, 30/64, 54/64, 22/64],
  [ 3/64, 35/64, 11/64, 43/64,  1/64, 33/64,  9/64, 41/64],
  [51/64, 19/64, 59/64, 27/64, 49/64, 17/64, 57/64, 25/64],
  [15/64, 47/64,  7/64, 39/64, 13/64, 45/64,  5/64, 37/64],
  [63/64, 31/64, 55/64, 23/64, 61/64, 29/64, 53/64, 21/64]
];

function ign_threshold(x: number, y: number, frame: number): number {
  const fx = x, fy = y + frame * 5.588238;
  const m = 0.06711056 * fx + 0.00583715 * fy;
  const mMod = m - Math.floor(m);
  const val = (52.9829189 * mMod) % 1.0;
  return val < 0 ? val + 1 : val;
}

function blue_noise_threshold(x: number, y: number, seed: number): number {
  const h = hash3(x, y, seed);
  const r = u01(h);
  const v = (r + x * 0.75487766 + y * 0.56984029) % 1.0;
  return v < 0 ? v + 1 : v;
}

function screen_threshold(algo: number, x: number, y: number, angleDeg: number, scalePct: number): number {
  const rad = angleDeg * (Math.PI / 180);
  const cosA = Math.cos(rad), sinA = Math.sin(rad);
  const sc = Math.max(0.2, scalePct / 100.0);
  const u = (cosA * x - sinA * y) / (4.0 * sc);
  const v = (sinA * x + cosA * y) / (4.0 * sc);
  const iu = Math.floor(u), iv = Math.floor(v);
  const fu = u - iu, fv = v - iv;

  switch (algo) {
    case 23:
    case 24:
    case 25: {
      const dx = fu - 0.5, dy = fv - 0.5;
      return clamp(Math.hypot(dx, dy) * 1.4142, 0, 1);
    }
    case 26:
      return clamp(Math.abs(fu - 0.5) + Math.abs(fv - 0.5), 0, 1);
    case 27:
      return clamp(Math.max(Math.abs(fu - 0.5), Math.abs(fv - 0.5)) * 2.0, 0, 1);
    case 28:
      return ((iu ^ iv) & 1) ? 0.35 : 0.65;
    case 29:
      return (((Math.floor(u * 0.5) + Math.floor(v * 0.5)) & 1) ? 0.25 : 0.75);
    case 30:
      return clamp(Math.abs(Math.sin(v * Math.PI)), 0, 1);
    case 31:
      return clamp(Math.sin(u * Math.PI) * 0.5 + Math.cos(v * Math.PI) * 0.5 + 0.5, 0, 1);
    case 32:
      return clamp(Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 2) * 0.5 + 0.5, 0, 1);
    case 33:
      return clamp(Math.abs(Math.sin(u * Math.PI)), 0, 1);
    case 34:
      return Math.abs(u + v) % 1.0;
    case 35:
      return Math.abs(u - v) % 1.0;
    case 36:
      return Math.abs(u * 1.5 + Math.sin(v * 2.0) * 0.5) % 1.0;
    case 37:
      return (Math.abs(fu - 0.5) > 0.4 || Math.abs(fv - 0.5) > 0.4) ? 0.2 : 0.8;
    case 38:
      return (((iu * 3 + iv * 7) & 15) / 15.0);
    case 39:
      return clamp((Math.abs(fu - 0.5) * Math.abs(fv - 0.5)) * 4.0, 0, 1);
    case 40:
      return clamp(Math.abs(fu - 0.5) + Math.abs(fv - 0.5), 0, 1);
    case 41:
      return clamp(Math.min(Math.abs(fu - 0.5), Math.abs(fv - 0.5)) * 2.0 + Math.hypot(fu - 0.5, fv - 0.5), 0, 1);
    case 42:
      return Math.abs(Math.sin(u * Math.PI) + Math.sin(v * Math.PI * 2) * 0.5) % 1.0;
    case 43:
      return Math.abs((iu ^ iv) * 0.2 + fu) % 1.0;
    case 44:
      return ((iu & 3) === 0 || (iv & 3) === 0) ? 0.3 : 0.7;
    case 45:
      return (fv + ((iu & 1) ? 0.5 : 0.0)) % 1.0;
    case 46:
      return (fu + ((iv & 1) ? 0.5 : 0.0)) % 1.0;
    case 47:
      return clamp(Math.atan2(fv - 0.5, fu - 0.5) / (Math.PI * 2) + 0.5, 0, 1);
    case 48:
      return clamp((Math.sin(u * Math.PI) + Math.cos(v * Math.PI)) * 0.25 + 0.5, 0, 1);
    case 49:
      return clamp(Math.abs(Math.sin(u * Math.PI + Math.sin(v * Math.PI))), 0, 1);
    default:
      return BAYER4[y & 3][x & 3];
  }
}

interface KernelItem {
  dx: number;
  dy: number;
  w: number;
}

function getDiffusionKernel(algo: number): { kernel: KernelItem[]; divisor: number } {
  switch (algo) {
    case 1:
    case 2:
      return {
        kernel: [{ dx: 1, dy: 0, w: 7 }, { dx: -1, dy: 1, w: 3 }, { dx: 0, dy: 1, w: 5 }, { dx: 1, dy: 1, w: 1 }],
        divisor: 16
      };
    case 3:
      return {
        kernel: [
          { dx: 1, dy: 0, w: 7 }, { dx: 2, dy: 0, w: 5 },
          { dx: -2, dy: 1, w: 3 }, { dx: -1, dy: 1, w: 5 }, { dx: 0, dy: 1, w: 7 }, { dx: 1, dy: 1, w: 5 }, { dx: 2, dy: 1, w: 3 },
          { dx: -2, dy: 2, w: 1 }, { dx: -1, dy: 2, w: 3 }, { dx: 0, dy: 2, w: 5 }, { dx: 1, dy: 2, w: 3 }, { dx: 2, dy: 2, w: 1 }
        ],
        divisor: 48
      };
    case 4:
      return {
        kernel: [
          { dx: 1, dy: 0, w: 8 }, { dx: 2, dy: 0, w: 4 },
          { dx: -2, dy: 1, w: 2 }, { dx: -1, dy: 1, w: 4 }, { dx: 0, dy: 1, w: 8 }, { dx: 1, dy: 1, w: 4 }, { dx: 2, dy: 1, w: 2 },
          { dx: -2, dy: 2, w: 1 }, { dx: -1, dy: 2, w: 2 }, { dx: 0, dy: 2, w: 4 }, { dx: 1, dy: 2, w: 2 }, { dx: 2, dy: 2, w: 1 }
        ],
        divisor: 42
      };
    case 5:
      return {
        kernel: [
          { dx: 1, dy: 0, w: 1 }, { dx: 2, dy: 0, w: 1 },
          { dx: -1, dy: 1, w: 1 }, { dx: 0, dy: 1, w: 1 }, { dx: 1, dy: 1, w: 1 },
          { dx: 0, dy: 2, w: 1 }
        ],
        divisor: 8
      };
    case 6:
      return {
        kernel: [
          { dx: 1, dy: 0, w: 8 }, { dx: 2, dy: 0, w: 4 },
          { dx: -2, dy: 1, w: 2 }, { dx: -1, dy: 1, w: 4 }, { dx: 0, dy: 1, w: 8 }, { dx: 1, dy: 1, w: 4 }, { dx: 2, dy: 1, w: 2 }
        ],
        divisor: 32
      };
    case 7:
      return {
        kernel: [
          { dx: 1, dy: 0, w: 5 }, { dx: 2, dy: 0, w: 3 },
          { dx: -2, dy: 1, w: 2 }, { dx: -1, dy: 1, w: 4 }, { dx: 0, dy: 1, w: 5 }, { dx: 1, dy: 1, w: 4 }, { dx: 2, dy: 1, w: 2 },
          { dx: -1, dy: 2, w: 2 }, { dx: 0, dy: 2, w: 3 }, { dx: 1, dy: 2, w: 2 }
        ],
        divisor: 32
      };
    case 8:
      return {
        kernel: [
          { dx: 1, dy: 0, w: 4 }, { dx: 2, dy: 0, w: 3 },
          { dx: -2, dy: 1, w: 1 }, { dx: -1, dy: 1, w: 2 }, { dx: 0, dy: 1, w: 3 }, { dx: 1, dy: 1, w: 2 }, { dx: 2, dy: 1, w: 1 }
        ],
        divisor: 16
      };
    case 9:
      return {
        kernel: [{ dx: 1, dy: 0, w: 2 }, { dx: -1, dy: 1, w: 1 }, { dx: 0, dy: 1, w: 1 }],
        divisor: 4
      };
    case 10:
      return {
        kernel: [{ dx: 1, dy: 0, w: 7 }, { dx: -1, dy: 1, w: 1 }, { dx: 0, dy: 1, w: 2 }, { dx: 1, dy: 1, w: 4 }, { dx: 2, dy: 1, w: 2 }],
        divisor: 16
      };
    case 11:
      return {
        kernel: [{ dx: 1, dy: 0, w: 4 }, { dx: -2, dy: 1, w: 1 }, { dx: -1, dy: 1, w: 1 }, { dx: 0, dy: 1, w: 2 }],
        divisor: 8
      };
    case 12:
      return {
        kernel: [{ dx: 2, dy: 0, w: 1 }, { dx: 0, dy: 2, w: 1 }],
        divisor: 2
      };
    case 13:
      return {
        kernel: [{ dx: 2, dy: 0, w: 2 }, { dx: -1, dy: 2, w: 1 }, { dx: 1, dy: 2, w: 1 }],
        divisor: 4
      };
    case 14:
      return {
        kernel: [{ dx: 2, dy: 0, w: 3 }, { dx: -2, dy: 2, w: 1 }, { dx: 0, dy: 2, w: 2 }, { dx: 2, dy: 2, w: 2 }],
        divisor: 8
      };
    case 15:
      return {
        kernel: [{ dx: 1, dy: 0, w: 4 }, { dx: -1, dy: 1, w: 2 }, { dx: 0, dy: 1, w: 3 }, { dx: 1, dy: 1, w: 1 }],
        divisor: 10
      };
    default:
      return {
        kernel: [{ dx: 1, dy: 0, w: 7 }, { dx: -1, dy: 1, w: 3 }, { dx: 0, dy: 1, w: 5 }, { dx: 1, dy: 1, w: 1 }],
        divisor: 16
      };
  }
}

function quantizePalettePixel(
  colorMode: number,
  luma: number,
  threshMod: number,
  strFactor: number,
  inR: number,
  inG: number,
  inB: number
): RGBPixel {
  if (colorMode === 1) {
    // Preserve Original Colors
    const spread = (threshMod - 0.5) * (0.8 + strFactor * 0.35);
    return {
      r: inR + spread >= 0.5 ? 1.0 : 0.0,
      g: inG + spread >= 0.5 ? 1.0 : 0.0,
      b: inB + spread >= 0.5 ? 1.0 : 0.0
    };
  }

  if (colorMode === 2) {
    // Monochrome B&W
    const isWhite = luma >= threshMod ? 1.0 : 0.0;
    return { r: isWhite, g: isWhite, b: isWhite };
  }

  const palEntry = DITHER_PALETTES.find((p) => p.id === colorMode) || DITHER_PALETTES[1];
  const pal = palEntry.colors;
  const numColors = pal.length;

  const spread = (threshMod - 0.5) * (0.7 + strFactor * 0.35);
  const targetVal = clamp(luma + spread, 0.0, 1.0);
  const pIdx = clamp(Math.floor(targetVal * numColors), 0, numColors - 1);
  return pal[pIdx];
}

/**
 * 1:1 Rendering function mirroring core/dither.cpp render_dither()
 */
export function renderDither(
  imageData: ImageData,
  params: DitherParams,
  frame: number = 0
): ImageData {
  if (!params.enabled) return imageData;

  const W = imageData.width;
  const H = imageData.height;
  const data = imageData.data;
  const out = new ImageData(W, H);
  const outData = out.data;

  const contrast = clamp(params.contrast / 100.0, 0.0, 3.0);
  const brightness = clamp(params.brightness / 100.0, -1.0, 1.0);
  const jitter = clamp(params.randomness / 100.0, 0.0, 1.0);
  const bias = (params.threshold - 50.0) / 100.0;
  const seedVal = hash3(params.seed, 12345, 0x9e3779b9);

  const strengthVal = clamp(params.strength, -20.0, 20.0);
  const strFactor = strengthVal / 20.0; // -1.0 .. +1.0
  const ditherCoverage = clamp(params.amount / 100.0, 0.0, 1.0);
  const ditherScale = Math.max(1, Math.min(16, Math.round(params.scale)));

  // Error Diffusion (1..15)
  if (params.algorithm >= 1 && params.algorithm <= 15) {
    const { kernel, divisor } = getDiffusionKernel(params.algorithm);
    const invDiv = divisor > 0.001 ? 1.0 / divisor : 1.0;
    const serpentine = params.serpentine || params.algorithm === 2;

    const gw = Math.max(1, Math.floor((W + ditherScale - 1) / ditherScale));
    const gh = Math.max(1, Math.floor((H + ditherScale - 1) / ditherScale));
    const gridPixels = gw * gh;

    const gridR = new Float32Array(gridPixels);
    const gridG = new Float32Array(gridPixels);
    const gridB = new Float32Array(gridPixels);
    const gridLuma = new Float32Array(gridPixels);

    for (let gy = 0; gy < gh; gy++) {
      const yStart = gy * ditherScale;
      const yEnd = Math.min(H, yStart + ditherScale);
      for (let gx = 0; gx < gw; gx++) {
        const xStart = gx * ditherScale;
        const xEnd = Math.min(W, xStart + ditherScale);
        let rAcc = 0, gAcc = 0, bAcc = 0, count = 0;

        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            const idx = (y * W + x) * 4;
            rAcc += data[idx] / 255.0;
            gAcc += data[idx + 1] / 255.0;
            bAcc += data[idx + 2] / 255.0;
            count++;
          }
        }

        const invC = count > 0 ? 1.0 / count : 1.0;
        let rAvg = rAcc * invC;
        let gAvg = gAcc * invC;
        let bAvg = bAcc * invC;

        rAvg = clamp((rAvg - 0.5) * contrast + 0.5 + brightness, 0, 1);
        gAvg = clamp((gAvg - 0.5) * contrast + 0.5 + brightness, 0, 1);
        bAvg = clamp((bAvg - 0.5) * contrast + 0.5 + brightness, 0, 1);
        if (params.linearGamma) {
          rAvg = Math.pow(rAvg, 2.2);
          gAvg = Math.pow(gAvg, 2.2);
          bAvg = Math.pow(bAvg, 2.2);
        }

        const gIdx = gy * gw + gx;
        gridR[gIdx] = rAvg;
        gridG[gIdx] = gAvg;
        gridB[gIdx] = bAvg;
        gridLuma[gIdx] = luma709(rAvg, gAvg, bAvg);
      }
    }

    // Xerox Grain toner edge boost (Algo 15)
    if (params.algorithm === 15 && gw > 2 && gh > 2) {
      const origL = new Float32Array(gridLuma);
      for (let gy = 1; gy < gh - 1; gy++) {
        for (let gx = 1; gx < gw - 1; gx++) {
          const gIdx = gy * gw + gx;
          const cVal = origL[gIdx];
          const lap = 4 * cVal - origL[(gy - 1) * gw + gx] - origL[(gy + 1) * gw + gx] - origL[gy * gw + (gx - 1)] - origL[gy * gw + (gx + 1)];
          const toner = (u01(hash3(gx, gy, seedVal)) - 0.5) * 0.12;
          gridLuma[gIdx] = clamp(cVal + lap * 0.55 + toner, 0, 1);
        }
      }
    }

    const errBuf = new Float32Array(gridPixels * 3);
    const outGrid = new Array<RGBPixel>(gridPixels);

    for (let gy = 0; gy < gh; gy++) {
      const rightToLeft = serpentine && (gy & 1) === 1;
      for (let i = 0; i < gw; i++) {
        const gx = rightToLeft ? gw - 1 - i : i;
        const gIdx = gy * gw + gx;

        const inR = clamp(gridR[gIdx] + errBuf[gIdx * 3 + 0], 0, 1);
        const inG = clamp(gridG[gIdx] + errBuf[gIdx * 3 + 1], 0, 1);
        const inB = clamp(gridB[gIdx] + errBuf[gIdx * 3 + 2], 0, 1);
        const luma = clamp(gridLuma[gIdx] + luma709(errBuf[gIdx * 3], errBuf[gIdx * 3 + 1], errBuf[gIdx * 3 + 2]), 0, 1);

        let baseThresh = 0.5 + bias;
        if (jitter > 0.001) {
          const j = (u01(hash3(gx, gy, seedVal)) - 0.5) * jitter * 0.4;
          baseThresh += j;
        }
        let threshMod = 0.5 + (baseThresh - 0.5) * (1.0 + strFactor * 0.85);
        threshMod = clamp(threshMod, 0.02, 0.98);

        const qCol = quantizePalettePixel(params.colorMode, luma, threshMod, strFactor, inR, inG, inB);

        const errWeight = 1.0 + strFactor * 0.25;
        const errR = (inR - qCol.r) * errWeight;
        const errG = (inG - qCol.g) * errWeight;
        const errB = (inB - qCol.b) * errWeight;

        for (let ki = 0; ki < kernel.length; ki++) {
          const ek = kernel[ki];
          const nx = gx + (rightToLeft ? -ek.dx : ek.dx);
          const ny = gy + ek.dy;
          if (nx >= 0 && nx < gw && ny >= 0 && ny < gh) {
            const nIdx = (ny * gw + nx) * 3;
            const w = ek.w * invDiv;
            errBuf[nIdx + 0] += errR * w;
            errBuf[nIdx + 1] += errG * w;
            errBuf[nIdx + 2] += errB * w;
          }
        }

        outGrid[gIdx] = qCol;
      }
    }

    // Scatter back to full resolution destination
    for (let y = 0; y < H; y++) {
      const gy = Math.min(gh - 1, Math.floor(y / ditherScale));
      for (let x = 0; x < W; x++) {
        const gx = Math.min(gw - 1, Math.floor(x / ditherScale));
        const gIdx = gy * gw + gx;
        const idx = (y * W + x) * 4;

        const ditherRnd = hash3(x, y, (seedVal ^ 0x9e3779b9) >>> 0);
        const sampleProb = u01(ditherRnd);

        if (sampleProb < ditherCoverage) {
          outData[idx + 0] = Math.round(outGrid[gIdx].r * 255);
          outData[idx + 1] = Math.round(outGrid[gIdx].g * 255);
          outData[idx + 2] = Math.round(outGrid[gIdx].b * 255);
        } else {
          outData[idx + 0] = data[idx + 0];
          outData[idx + 1] = data[idx + 1];
          outData[idx + 2] = data[idx + 2];
        }
        outData[idx + 3] = data[idx + 3];
      }
    }
  }
  // Ordered & Pattern Screens (16..49)
  else {
    for (let y = 0; y < H; y++) {
      const sy = Math.floor(y / ditherScale);
      for (let x = 0; x < W; x++) {
        const sx = Math.floor(x / ditherScale);
        const idx = (y * W + x) * 4;

        const r = data[idx] / 255.0;
        const g = data[idx + 1] / 255.0;
        const b = data[idx + 2] / 255.0;
        const a = data[idx + 3];

        let rAdj = clamp((r - 0.5) * contrast + 0.5 + brightness, 0, 1);
        let gAdj = clamp((g - 0.5) * contrast + 0.5 + brightness, 0, 1);
        let bAdj = clamp((b - 0.5) * contrast + 0.5 + brightness, 0, 1);
        if (params.linearGamma) {
          rAdj = Math.pow(rAdj, 2.2);
          gAdj = Math.pow(gAdj, 2.2);
          bAdj = Math.pow(bAdj, 2.2);
        }

        const luma = luma709(rAdj, gAdj, bAdj);

        let rawThresh = 0.5;
        switch (params.algorithm) {
          case 16:
            rawThresh = BAYER2[sy & 1][sx & 1];
            break;
          case 17:
            rawThresh = BAYER4[sy & 3][sx & 3];
            break;
          case 18:
            rawThresh = BAYER8[sy & 7][sx & 7];
            break;
          case 19: {
            const bx = sx & 15, by = sy & 15;
            const b8x = bx & 7, b8y = by & 7;
            const base = BAYER8[b8y][b8x];
            const sub = (bx >> 3) | ((by >> 3) << 1);
            rawThresh = clamp(base + sub * (1.0 / 256.0), 0, 1);
            break;
          }
          case 20:
            rawThresh = blue_noise_threshold(sx, sy, seedVal);
            break;
          case 21:
            rawThresh = ign_threshold(sx, sy, frame);
            break;
          case 22:
            rawThresh = u01(hash3(sx, sy, seedVal));
            break;
          default:
            rawThresh = screen_threshold(params.algorithm, sx, sy, params.patternAngle, params.patternScale);
            break;
        }

        rawThresh += bias;
        if (jitter > 0.001) {
          rawThresh += (u01(hash3(sx, sy, (seedVal ^ 0x51A8D) >>> 0)) - 0.5) * jitter * 0.4;
        }

        // Apply Dither Strength modulation in [-20, +20]
        let threshMod = 0.5 + (rawThresh - 0.5) * (1.0 + strFactor * 0.85);
        threshMod = clamp(threshMod, 0.02, 0.98);

        const qCol = quantizePalettePixel(params.colorMode, luma, threshMod, strFactor, rAdj, gAdj, bAdj);

        // Coverage check for Dither Amount
        const ditherRnd = hash3(x, y, (seedVal ^ 0x9e3779b9) >>> 0);
        const sampleProb = u01(ditherRnd);

        if (sampleProb < ditherCoverage) {
          outData[idx + 0] = Math.round(qCol.r * 255);
          outData[idx + 1] = Math.round(qCol.g * 255);
          outData[idx + 2] = Math.round(qCol.b * 255);
        } else {
          outData[idx + 0] = data[idx + 0];
          outData[idx + 1] = data[idx + 1];
          outData[idx + 2] = data[idx + 2];
        }
        outData[idx + 3] = a;
      }
    }
  }

  return out;
}
