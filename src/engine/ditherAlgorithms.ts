import { DitherAlgoInfo } from '../types';

export const F_SERP = 256;
export const F_XEROX = 512;
export const F_NOISE = 1024;

export interface DiffusionTap {
  dx: number;
  dy: number;
  w: number;
}

export interface DiffusionKernel {
  ntaps: number;
  taps: DiffusionTap[];
}

function makeKernel(raw: number[][], divisor: number): DiffusionKernel {
  const taps: DiffusionTap[] = raw.map(([dx, dy, w]) => ({
    dx,
    dy,
    w: w / divisor,
  }));
  return {
    ntaps: taps.length,
    taps,
  };
}

export const KERNELS: DiffusionKernel[] = [
  // 0: Floyd-Steinberg
  makeKernel([[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]], 16),
  // 1: Jarvis-Judice-Ninke
  makeKernel([
    [1, 0, 7], [2, 0, 5],
    [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3],
    [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1],
  ], 48),
  // 2: Stucki
  makeKernel([
    [1, 0, 8], [2, 0, 4],
    [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2],
    [-2, 2, 1], [-1, 2, 2], [0, 2, 4], [1, 2, 2], [2, 2, 1],
  ], 42),
  // 3: Atkinson
  makeKernel([
    [1, 0, 1], [2, 0, 1],
    [-1, 1, 1], [0, 1, 1], [1, 1, 1],
    [0, 2, 1],
  ], 8),
  // 4: Burkes
  makeKernel([
    [1, 0, 8], [2, 0, 4],
    [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2],
  ], 32),
  // 5: Sierra
  makeKernel([
    [1, 0, 5], [2, 0, 3],
    [-2, 1, 2], [-1, 1, 4], [0, 1, 5], [1, 1, 4], [2, 1, 2],
    [-1, 2, 2], [0, 2, 3], [1, 2, 2],
  ], 32),
  // 6: Sierra Two Row
  makeKernel([
    [1, 0, 4], [2, 0, 3],
    [-2, 1, 1], [-1, 1, 2], [0, 1, 3], [1, 1, 2], [2, 1, 1],
  ], 16),
  // 7: Sierra Lite
  makeKernel([[1, 0, 2], [-1, 1, 1], [0, 1, 1]], 4),
  // 8: Fan
  makeKernel([[1, 0, 7], [-1, 1, 1], [0, 1, 3], [1, 1, 5]], 16),
  // 9: Shiau-Fan
  makeKernel([[1, 0, 8], [-1, 1, 1], [0, 1, 2], [1, 1, 5]], 16),
  // 10: Skip Neighbours
  makeKernel([[2, 0, 7], [-2, 1, 3], [0, 1, 5], [2, 1, 1]], 16),
  // 11: Skip1 Neighbours
  makeKernel([[2, 0, 4], [-2, 2, 2], [0, 2, 6], [2, 2, 4]], 16),
  // 12: Skip2 Neighbours
  makeKernel([[3, 0, 5], [-1, 2, 4], [1, 2, 7]], 16),
  // 13: Xerox Grain
  makeKernel([[1, 0, 6], [0, 1, 4], [1, 1, 2]], 12),
];

const BAYER2_MAP = [
  0 / 4, 2 / 4,
  3 / 4, 1 / 4,
];

const BAYER4_MAP = [
  0 / 16,  8 / 16,  2 / 16, 10 / 16,
 12 / 16,  4 / 16, 14 / 16,  6 / 16,
  3 / 16, 11 / 16,  1 / 16,  9 / 16,
 15 / 16,  7 / 16, 13 / 16,  5 / 16,
];

const BAYER8_MAP = [
   0 / 64, 32 / 64,  8 / 64, 40 / 64,  2 / 64, 34 / 64, 10 / 64, 42 / 64,
  48 / 64, 16 / 64, 56 / 64, 24 / 64, 50 / 64, 18 / 64, 58 / 64, 26 / 64,
  12 / 64, 44 / 64,  4 / 64, 36 / 64, 14 / 64, 46 / 64,  6 / 64, 38 / 64,
  60 / 64, 28 / 64, 52 / 64, 20 / 64, 62 / 64, 30 / 64, 54 / 64, 22 / 64,
   3 / 64, 35 / 64, 11 / 64, 43 / 64,  1 / 64, 33 / 64,  9 / 64, 41 / 64,
  51 / 64, 19 / 64, 59 / 64, 27 / 64, 49 / 64, 17 / 64, 57 / 64, 25 / 64,
  15 / 64, 47 / 64,  7 / 64, 39 / 64, 13 / 64, 45 / 64,  5 / 64, 37 / 64,
  63 / 64, 31 / 64, 55 / 64, 23 / 64, 61 / 64, 29 / 64, 53 / 64, 21 / 64,
];

export function bayerThreshold(x: number, y: number, n: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  if (n <= 2) {
    return BAYER2_MAP[(yi & 1) * 2 + (xi & 1)];
  }
  if (n <= 4) {
    return BAYER4_MAP[(yi & 3) * 4 + (xi & 3)];
  }
  if (n <= 8) {
    return BAYER8_MAP[(yi & 7) * 8 + (xi & 7)];
  }
  const b8 = BAYER8_MAP[(yi & 7) * 8 + (xi & 7)];
  const bx = (xi >> 3) & 1;
  const by = (yi >> 3) & 1;
  const sub = bx | (by << 1);
  return Math.max(0, Math.min(1, b8 + sub * (1 / 256)));
}

export function blueNoiseThreshold(x: number, y: number, seed: number = 0): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  let h = (xi * 374761393 + yi * 668265263 + seed * 19937) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  const r = (h & 0x00ffffff) / 16777216.0;
  const v = (r + xi * 0.75487766 + yi * 0.56984029) % 1.0;
  return v < 0 ? v + 1 : v;
}

export function ignThreshold(x: number, y: number): number {
  const m = 0.06711056 * x + 0.00583715 * y;
  const val = (52.9829189 * (m % 1.0)) % 1.0;
  return val < 0 ? val + 1 : val;
}

const screenCache = new Map<number, Float32Array>();

export function getScreenMap(param: number): Float32Array {
  const cached = screenCache.get(param);
  if (cached) return cached;
  const size = 32;
  const map = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const dx = u - 0.5;
      const dy = v - 0.5;
      let val = Math.hypot(dx, dy) * 1.4142;
      val = Math.max(0, Math.min(1, val));
      map[y * size + x] = val;
    }
  }
  screenCache.set(param, map);
  return map;
}

export function sampleScreen(map: Float32Array, u: number, v: number): number {
  const size = 32;
  const fu = ((u % 1) + 1) % 1;
  const fv = ((v % 1) + 1) % 1;
  const x = Math.min(size - 1, Math.floor(fu * size));
  const y = Math.min(size - 1, Math.floor(fv * size));
  return map[y * size + x];
}

export const ALL_DITHER_ALGORITHMS: DitherAlgoInfo[] = [
  { id: 0, name: 'Floyd-Steinberg', category: 'DIFFUSION', kind: 'error', param: 0, cell: 1, angle: 0, desc: 'Error diffusion 7-3-5-1 /16' },
  { id: 1, name: 'Floyd-Steinberg Serpentine', category: 'DIFFUSION', kind: 'error', param: 0 | F_SERP, cell: 1, angle: 0, desc: 'Bidirectional alternating scan' },
  { id: 2, name: 'Jarvis-Judice-Ninke', category: 'DIFFUSION', kind: 'error', param: 1, cell: 1, angle: 0, desc: '3-row 48-divisor error diffusion' },
  { id: 3, name: 'Stucki', category: 'DIFFUSION', kind: 'error', param: 2, cell: 1, angle: 0, desc: 'High-contrast 42-divisor diffusion' },
  { id: 4, name: 'Atkinson', category: 'DIFFUSION', kind: 'error', param: 3, cell: 1, angle: 0, desc: 'Macintosh 1-bit crisp contrast' },
  { id: 5, name: 'Burkes', category: 'DIFFUSION', kind: 'error', param: 4, cell: 1, angle: 0, desc: '2-row 32-divisor diffusion' },
  { id: 6, name: 'Sierra', category: 'SIERRA', kind: 'error', param: 5, cell: 1, angle: 0, desc: '3-row 32-divisor Sierra' },
  { id: 7, name: 'Sierra Two Row', category: 'SIERRA', kind: 'error', param: 6, cell: 1, angle: 0, desc: '2-row Sierra' },
  { id: 8, name: 'Sierra Lite', category: 'SIERRA', kind: 'error', param: 7, cell: 1, angle: 0, desc: 'Fast 4-divisor Sierra' },
  { id: 9, name: 'Fan', category: 'DIFFUSION', kind: 'error', param: 8, cell: 1, angle: 0, desc: 'Edge-biased error diffusion' },
  { id: 10, name: 'Shiau-Fan', category: 'DIFFUSION', kind: 'error', param: 9, cell: 1, angle: 0, desc: 'Optimized high-detail diffusion' },
  { id: 11, name: 'Skip Neighbours', category: 'SKIP NEIGHBOURS', kind: 'error', param: 10, cell: 1, angle: 0, desc: 'Subsampled neighbor diffusion' },
  { id: 12, name: 'Skip1 Neighbours', category: 'SKIP NEIGHBOURS', kind: 'error', param: 11, cell: 1, angle: 0, desc: 'Cluster skip diffusion' },
  { id: 13, name: 'Skip2 Neighbours', category: 'SKIP NEIGHBOURS', kind: 'error', param: 12, cell: 1, angle: 0, desc: 'Wide sparse skip diffusion' },
  { id: 14, name: 'Xerox Grain', category: 'DIFFUSION', kind: 'error', param: 13 | F_XEROX, cell: 1, angle: 0, desc: 'Authentic photocopier toner grain' },
  { id: 15, name: 'Bayer 2x2', category: 'BAYER', kind: 'bayer', param: 2, cell: 2, angle: 0, desc: '2x2 crosshatch dither' },
  { id: 16, name: 'Bayer 4x4', category: 'BAYER', kind: 'bayer', param: 4, cell: 4, angle: 0, desc: 'Classic 4x4 ordered dither' },
  { id: 17, name: 'Bayer 8x8', category: 'BAYER', kind: 'bayer', param: 8, cell: 8, angle: 0, desc: 'High-fidelity 8x8 ordered dither' },
  { id: 18, name: 'Bayer 16x16', category: 'BAYER', kind: 'bayer', param: 16, cell: 16, angle: 0, desc: 'Smooth 16x16 tonal grading' },
  { id: 19, name: 'Blue Noise', category: 'OTHER', kind: 'blue', param: 0, cell: 1, angle: 0, desc: 'Aperiodic high-frequency stippling' },
  { id: 20, name: 'Interleaved Gradient Noise', category: 'OTHER', kind: 'ign', param: 0, cell: 1, angle: 0, desc: 'Jimenez Interleaved Gradient Noise' },
  { id: 21, name: 'White Noise', category: 'OTHER', kind: 'white', param: 0, cell: 1, angle: 0, desc: 'Uniform stochastic noise' },
  { id: 22, name: 'Halftone 0°', category: 'HALFTONE', kind: 'screen', param: 23, cell: 8, angle: 0, desc: 'Orthogonal dot screen' },
  { id: 23, name: 'Halftone 22.5°', category: 'HALFTONE', kind: 'screen', param: 24, cell: 8, angle: 22.5, desc: 'Angled offset spot screen' },
  { id: 24, name: 'Halftone 45°', category: 'HALFTONE', kind: 'screen', param: 25, cell: 8, angle: 45, desc: 'Classic newsprint rosette screen' },
  { id: 25, name: 'Matrix', category: 'PATTERN', kind: 'screen', param: 26, cell: 6, angle: 0, desc: 'Diamond matrix screen' },
  { id: 26, name: 'Square Halftone', category: 'HALFTONE', kind: 'screen', param: 27, cell: 8, angle: 0, desc: 'Concentric square blocks' },
  { id: 27, name: 'Mosaic Halftone', category: 'MOSAIC', kind: 'screen', param: 28, cell: 6, angle: 0, desc: 'Checkerboard mosaic' },
  { id: 28, name: 'Rekt Block', category: 'MOSAIC', kind: 'screen', param: 29, cell: 8, angle: 0, desc: 'Brutalist rectangular blocks' },
  { id: 29, name: 'Row Modulation', category: 'MODULATION', kind: 'screen', param: 30, cell: 6, angle: 0, desc: 'Horizontal line screen' },
  { id: 30, name: 'Medium Modulation', category: 'MODULATION', kind: 'screen', param: 31, cell: 8, angle: 0, desc: 'Harmonic 2D wave modulation' },
  { id: 31, name: 'Heavy Modulation', category: 'MODULATION', kind: 'screen', param: 32, cell: 10, angle: 0, desc: 'High-contrast grid modulation' },
  { id: 32, name: 'Column Modulation', category: 'MODULATION', kind: 'screen', param: 33, cell: 6, angle: 0, desc: 'Vertical stripe modulation' },
  { id: 33, name: 'Tilt (+45°)', category: 'PATTERN', kind: 'screen', param: 34, cell: 6, angle: 45, desc: '45-degree diagonal engraving' },
  { id: 34, name: 'Bitslash (-45°)', category: 'PATTERN', kind: 'screen', param: 35, cell: 6, angle: -45, desc: 'Negative diagonal hatch' },
  { id: 35, name: 'Variable Hatch', category: 'PATTERN', kind: 'screen', param: 36, cell: 8, angle: 0, desc: 'Organic woodcut wavy hatch' },
  { id: 36, name: 'Grid Screen', category: 'PATTERN', kind: 'screen', param: 37, cell: 6, angle: 0, desc: 'Orthogonal wireframe grid' },
  { id: 37, name: 'Cyberpunk Grid', category: 'PATTERN', kind: 'screen', param: 38, cell: 8, angle: 0, desc: 'Futuristic bitmapped matrix' },
  { id: 38, name: 'Cross Square', category: 'PATTERN', kind: 'screen', param: 39, cell: 6, angle: 0, desc: 'Cruciform halftone square' },
  { id: 39, name: 'Diamond Halftone', category: 'PATTERN', kind: 'screen', param: 40, cell: 6, angle: 45, desc: 'Diamond grid spot screen' },
  { id: 40, name: 'Star Screen', category: 'PATTERN', kind: 'screen', param: 41, cell: 8, angle: 0, desc: 'Radial starburst halftoning' },
  { id: 41, name: 'Bytewav', category: 'MODULATION', kind: 'screen', param: 42, cell: 10, angle: 0, desc: 'Digital harmonic ripples' },
  { id: 42, name: 'Z-Modulation', category: 'MODULATION', kind: 'screen', param: 43, cell: 8, angle: 0, desc: 'Z-order space filling curve' },
  { id: 43, name: 'Circuit', category: 'PATTERN', kind: 'screen', param: 44, cell: 8, angle: 0, desc: 'PCB trace routing pattern' },
  { id: 44, name: 'Vertical Stitch', category: 'PATTERN', kind: 'screen', param: 45, cell: 6, angle: 0, desc: 'Embroidery running stitch' },
  { id: 45, name: 'Horizontal Stitch', category: 'PATTERN', kind: 'screen', param: 46, cell: 6, angle: 0, desc: 'Cross-grain woven stitch' },
  { id: 46, name: 'Clock Screen', category: 'PATTERN', kind: 'screen', param: 47, cell: 12, angle: 0, desc: 'Angular radial clock dial' },
  { id: 47, name: 'Bi-thread', category: 'PATTERN', kind: 'screen', param: 48, cell: 8, angle: 0, desc: 'Textile twill weave screen' },
  { id: 48, name: 'Knit Screen', category: 'PATTERN', kind: 'screen', param: 49, cell: 8, angle: 0, desc: 'Knitted yarn interlocking loops' },
];
