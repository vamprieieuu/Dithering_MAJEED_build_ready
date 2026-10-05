import { AlgorithmDef, DitherParams, LevelsConfig, RGBColor } from '../types/dither';
import { hexToRgb, rgbToHex, PALETTE_PRESETS } from './paletteData';

// ---------------------------------------------------------------------------
// 49 ALGORITHMS (Exact match to core/dither.cpp and Photoshop plugin)
// ---------------------------------------------------------------------------
export const ALGORITHMS: AlgorithmDef[] = [
  // DIFFUSION
  { id: 0, name: 'Floyd-Steinberg', category: 'DIFFUSION', kind: 'error', param: 0, desc: 'Classic error diffusion 7-3-5-1 /16' },
  { id: 1, name: 'Floyd-Steinberg Serpentine', category: 'DIFFUSION', kind: 'error', param: 0 | 256, desc: 'Floyd-Steinberg with alternating scan direction to eliminate directional worming' },
  { id: 2, name: 'Jarvis-Judice-Ninke', category: 'DIFFUSION', kind: 'error', param: 1, desc: 'Wide 3-row 12-tap error diffusion kernel /48 for smooth gradients' },
  { id: 3, name: 'Stucki', category: 'DIFFUSION', kind: 'error', param: 2, desc: 'Sharp 3-row 12-tap kernel /42 preserving edge contrast' },
  { id: 4, name: 'Atkinson', category: 'DIFFUSION', kind: 'error', param: 3, desc: 'Original Apple Mac dither, diffuses 6/8 of error for crisp, high-contrast look' },
  { id: 5, name: 'Burkes', category: 'DIFFUSION', kind: 'error', param: 4, desc: 'Fast 2-row 7-tap kernel /32' },
  { id: 6, name: 'Sierra', category: 'SIERRA', kind: 'error', param: 5, desc: 'Sierra-3, full 3-row 10-tap diffusion kernel /32' },
  { id: 7, name: 'Sierra Two Row', category: 'SIERRA', kind: 'error', param: 6, desc: 'Sierra-2, balanced 2-row 7-tap kernel /16' },
  { id: 8, name: 'Sierra Lite', category: 'SIERRA', kind: 'error', param: 7, desc: 'Ultra-fast 2-row 3-tap kernel 2-1-1 /4' },
  { id: 9, name: 'Fan', category: 'DIFFUSION', kind: 'error', param: 8, desc: 'Fan 4-tap asymmetric kernel /16' },
  { id: 10, name: 'Shiau-Fan', category: 'DIFFUSION', kind: 'error', param: 9, desc: 'Shiau-Fan 5-tap wide dispersal kernel /16' },
  { id: 11, name: 'Skip Neighbours', category: 'DIFFUSION', kind: 'error', param: 10, desc: '2-pixel step woven cluster error diffusion' },
  { id: 12, name: 'Skip1 Neighbours', category: 'DIFFUSION', kind: 'error', param: 11, desc: '3-pixel step structured stipple diffusion' },
  { id: 13, name: 'Skip2 Neighbours', category: 'DIFFUSION', kind: 'error', param: 12, desc: '4-pixel step cross-weave stippled diffusion' },
  { id: 14, name: 'Xerox Grain', category: 'DIFFUSION', kind: 'error', param: 0 | 256 | 512 | 1024, desc: 'Photocopy toner edge boost + grainy serpentine diffusion' },

  // BAYER & ORDERED
  { id: 15, name: 'Bayer 2x2', category: 'BAYER', kind: 'bayer', param: 2, desc: 'Coarse 2x2 ordered crosshatch threshold matrix' },
  { id: 16, name: 'Bayer 4x4', category: 'BAYER', kind: 'bayer', param: 4, desc: 'Classic 4x4 ordered dither matrix (Game Boy style)' },
  { id: 17, name: 'Bayer 8x8', category: 'BAYER', kind: 'bayer', param: 8, desc: 'Fine 8x8 ordered dither matrix for detailed tonal ramps' },
  { id: 18, name: 'Bayer 16x16', category: 'BAYER', kind: 'bayer', param: 16, desc: 'Ultra-fine 16x16 ordered dither with 256 tone steps' },

  // NOISE & STOCHASTIC
  { id: 19, name: 'Blue Noise', category: 'NOISE', kind: 'blue', param: 0, desc: 'Isotropic high-frequency blue-noise field with zero low-frequency clumping' },
  { id: 20, name: 'Interleaved Gradient Noise', category: 'NOISE', kind: 'ign', param: 0, desc: 'Jorge Jimenez high-speed interleaved spiral gradient noise' },
  { id: 21, name: 'White Noise', category: 'NOISE', kind: 'white', param: 0, desc: 'True stochastic random threshold per dither cell' },

  // HALFTONE
  { id: 22, name: 'Halftone', category: 'HALFTONE', kind: 'screen', param: 0, cell: 8, angle: 0, desc: 'Orthogonal round-dot halftone print screen (0 deg)' },
  { id: 23, name: 'Halftone 22.5°', category: 'HALFTONE', kind: 'screen', param: 0, cell: 8, angle: 22.5, desc: 'Round-dot halftone rotated 22.5 deg to avoid moire' },
  { id: 24, name: 'Halftone 45°', category: 'HALFTONE', kind: 'screen', param: 0, cell: 8, angle: 45, desc: 'Traditional newspaper round-dot halftone screen (45 deg)' },
  { id: 25, name: 'Matrix', category: 'PATTERN', kind: 'screen', param: 0, cell: 4, angle: 45, desc: 'Fine CRT/LED sub-pixel dot matrix screen' },
  { id: 26, name: 'Square Halftone', category: 'MOSAIC', kind: 'screen', param: 1, cell: 8, angle: 0, desc: 'Crisp expanding square-dot geometric screen' },
  { id: 27, name: 'Mosaic Halftone', category: 'MOSAIC', kind: 'screen', param: 2, cell: 6, angle: 0, desc: 'Beveled cushion mosaic tile screen' },
  { id: 28, name: 'Rekt Block', category: 'PATTERN', kind: 'screen', param: 3, cell: 8, angle: 0, desc: 'Staggered 2:1 rectangular brick screen' },

  // MODULATION & SCANLINES
  { id: 29, name: 'Row Modulation', category: 'MODULATION', kind: 'screen', param: 4, cell: 4, angle: 0, desc: 'Fine horizontal scanline pulse-width modulation' },
  { id: 30, name: 'Medium Modulation', category: 'MODULATION', kind: 'screen', param: 5, cell: 6, angle: 0, desc: 'Notched CRT slot-mask horizontal modulation' },
  { id: 31, name: 'Heavy Modulation', category: 'MODULATION', kind: 'screen', param: 6, cell: 9, angle: 0, desc: 'Bold serrated horizontal beam screen' },
  { id: 32, name: 'Column Modulation', category: 'MODULATION', kind: 'screen', param: 7, cell: 5, angle: 0, desc: 'Vertical aperture-grille bar modulation' },
  { id: 33, name: 'Tilt Modulation', category: 'MODULATION', kind: 'screen', param: 8, cell: 6, angle: 0, desc: '+45 deg copperplate engraving diagonal line screen' },
  { id: 34, name: 'Bitslash', category: 'PATTERN', kind: 'screen', param: 9, cell: 5, angle: 0, desc: '-45 deg stepped 8-bit slash screen' },
  { id: 35, name: 'Variable Hatch', category: 'PATTERN', kind: 'screen', param: 10, cell: 8, angle: 0, desc: 'Woodcut cross-hatching (single to double cross-hatch)' },
  { id: 36, name: 'Grid Modulation', category: 'MODULATION', kind: 'screen', param: 11, cell: 7, angle: 0, desc: 'Expanding orthogonal wireframe mesh screen' },
  { id: 37, name: 'Cyber', category: 'OTHER', kind: 'screen', param: 12, cell: 8, angle: 0, desc: 'Octagonal cyberpunk tech-cell matrix with corner nodes' },
  { id: 38, name: 'Cross Square', category: 'PATTERN', kind: 'screen', param: 13, cell: 7, angle: 0, desc: 'Expanding plus-cross clusters' },
  { id: 39, name: 'Diamond', category: 'OTHER', kind: 'screen', param: 14, cell: 8, angle: 0, desc: 'Manhattan-distance diamond clusters' },
  { id: 40, name: 'Star', category: 'OTHER', kind: 'screen', param: 15, cell: 9, angle: 0, desc: 'Concave 4-pointed astroid star clusters' },
  { id: 41, name: 'Bytewav', category: 'OTHER', kind: 'screen', param: 16, cell: 8, angle: 0, desc: 'Frequency-modulated sine-wave line screen' },
  { id: 42, name: 'Z-Modulation', category: 'MODULATION', kind: 'screen', param: 17, cell: 8, angle: 0, desc: 'Chevron herringbone zig-zag screen' },
  { id: 43, name: 'Circuit Modulation', category: 'MODULATION', kind: 'screen', param: 18, cell: 10, angle: 0, desc: 'PCB concentric tracks and solder pads' },
  { id: 44, name: 'Vertical Stitch', category: 'OTHER', kind: 'screen', param: 19, cell: 6, angle: 0, desc: 'Staggered vertical embroidery stitch pattern' },
  { id: 45, name: 'Horizontal Stitch', category: 'OTHER', kind: 'screen', param: 20, cell: 6, angle: 0, desc: 'Staggered horizontal running stitch pattern' },
  { id: 46, name: 'Clock', category: 'OTHER', kind: 'screen', param: 21, cell: 10, angle: 0, desc: 'Radial pinwheel sector sweep screen' },
  { id: 47, name: 'Bi-thread', category: 'OTHER', kind: 'screen', param: 22, cell: 7, angle: 0, desc: 'Over-under twill basketweave texture' },
  { id: 48, name: 'Knit', category: 'PATTERN', kind: 'screen', param: 23, cell: 7, angle: 0, desc: 'V-shaped jersey knit stitch loops' },
];

// Helper fast hash
function hashU32(x: number): number {
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

function hash3(a: number, b: number, c: number): number {
  const h1 = Math.imul(a, 0x9e3779b1) ^ hashU32(b + (0x85ebca6b ^ hashU32(c + 0xc2b2ae35)));
  return hashU32(h1);
}

function u01(h: number): number {
  return (h >>> 8) * (1.0 / 16777216.0);
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function luma709(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---------------------------------------------------------------------------
// SPOT FUNCTIONS (continuous 2D spot mathematical representations)
// ---------------------------------------------------------------------------
function spotFunction(id: number, fu: number, fv: number, pu: number, pv: number): number {
  const du = fu - 0.5;
  const dv = fv - 0.5;
  const par = (pu + pv) & 1;
  const tri = (t: number) => {
    t = t - Math.floor(t);
    return 1.0 - Math.abs(2.0 * t - 1.0);
  };
  const frac1 = (t: number) => t - Math.floor(t);

  switch (id) {
    case 0: { // S_DOT
      const d1 = Math.sqrt(du * du + dv * dv);
      const c2u = (fu < 0.5 ? fu + 0.5 : fu - 0.5) - 0.5;
      const c2v = (fv < 0.5 ? fv + 0.5 : fv - 0.5) - 0.5;
      const d2 = Math.sqrt(c2u * c2u + c2v * c2v);
      return 0.5 + (d1 - d2) * 0.7071;
    }
    case 1: // S_SQUARE
      return Math.max(Math.abs(du), Math.abs(dv)) * 2.0;

    case 2: { // S_MOSAIC
      const bx = Math.abs(du) * 2.0;
      const by = Math.abs(dv) * 2.0;
      const edge = Math.max(bx, by);
      const dome = Math.sqrt(du * du + dv * dv) * 1.4;
      return edge > 0.82 ? 0.95 + (edge - 0.82) : 0.45 * edge + 0.55 * dome;
    }
    case 3: { // S_RECT
      const bu = frac1(fu + (pv ? 0.5 : 0.0)) - 0.5;
      return Math.max(Math.abs(bu) * 1.5, Math.abs(dv) * 2.4);
    }
    case 4: // S_LINEH
      return Math.abs(dv) * 2.0 + 0.04 * tri(fu);

    case 5: { // S_LINEMED
      const su = frac1(fu + (pv ? 0.5 : 0.0));
      const bridge = su > 0.82 ? (0.32 * (su - 0.82)) / 0.18 : 0.0;
      return Math.abs(dv) * 1.85 + bridge;
    }
    case 6: { // S_LINEHEAVY
      const wave = 0.14 * (tri(fu * 2.0) - 0.5);
      return Math.abs(dv + wave) * 1.8;
    }
    case 7: // S_LINEV
      return Math.abs(du) * 2.0 + 0.04 * tri(fv);

    case 8: // S_DIAG
      return Math.abs(frac1((fu + pu + fv + pv) * 0.5) - 0.5) * 2.0;

    case 9: { // S_DIAG2 (Bitslash)
      const slash = Math.abs(frac1((fu + pu - (fv + pv)) * 0.5) - 0.5) * 2.0;
      const notch = 0.15 * tri((fu + pu + fv + pv) * 1.5);
      return slash * 0.88 + notch;
    }
    case 10: { // S_HATCH
      const d1 = Math.abs(frac1((fu + pu + fv + pv) * 0.5) - 0.5) * 2.0;
      const d2 = Math.abs(frac1((fu + pu - (fv + pv)) * 0.5) - 0.5) * 2.0;
      return d1 < 0.45 ? d1 * 1.1 : 0.5 + 0.5 * Math.min(d1, d2);
    }
    case 11: // S_GRID
      return Math.min(Math.min(fu, 1.0 - fu), Math.min(fv, 1.0 - fv)) * 2.0;

    case 12: { // S_CYBER
      const ax = Math.abs(du) * 2.0;
      const ay = Math.abs(dv) * 2.0;
      const oct = Math.max(Math.max(ax, ay), (ax + ay) * 0.72);
      const ring = Math.abs(oct - 0.68) * 2.2;
      const core = (ax + ay) * 1.4;
      return Math.min(ring, core + 0.25);
    }
    case 13: { // S_CROSS
      const arm = Math.min(Math.abs(du), Math.abs(dv)) * 2.4;
      const span = Math.max(Math.abs(du), Math.abs(dv)) * 0.65;
      return arm + span;
    }
    case 14: // S_DIAMOND
      return Math.abs(du) + Math.abs(dv);

    case 15: { // S_STAR
      const a = Math.pow(Math.abs(du) + 1e-4, 0.55) + Math.pow(Math.abs(dv) + 1e-4, 0.55);
      return a * a * 0.85;
    }
    case 16: { // S_WAVE (Bytewav)
      const u2 = (fu + pu) * 0.5;
      const w = 0.28 * Math.sin(6.2831853 * u2);
      return Math.abs(frac1(fv + w) - 0.5) * 2.0;
    }
    case 17: { // S_ZIGZAG
      const u2 = (fu + pu) * 0.5;
      const z = 0.38 * (tri(u2 * 2.0) - 0.5);
      return Math.abs(frac1(fv + z) - 0.5) * 2.0;
    }
    case 18: { // S_CIRCUIT
      const r = Math.max(Math.abs(du), Math.abs(dv)) * 2.0;
      const target = par ? 0.32 : 0.68;
      const trace = Math.abs(r - target) * 2.6;
      const pad = Math.max(Math.abs(du), Math.abs(dv)) * 3.5;
      return par ? Math.min(trace, pad) : trace;
    }
    case 19: { // S_STITCHV
      const sv = frac1(fv + (pu ? 0.5 : 0.0));
      const gap = sv > 0.72 ? (sv - 0.72) * 2.5 : 0.0;
      return Math.abs(du) * 1.9 + gap;
    }
    case 20: { // S_STITCHH
      const su = frac1(fu + (pv ? 0.5 : 0.0));
      const gap = su > 0.72 ? (su - 0.72) * 2.5 : 0.0;
      return Math.abs(dv) * 1.9 + gap;
    }
    case 21: { // S_CLOCK
      const ang = Math.atan2(dv, du) * 0.15915494 + 0.5;
      const rad = Math.sqrt(du * du + dv * dv) * 1.414;
      const blades = tri(ang * 4.0 + (par ? 0.25 : 0.0) + rad * 0.35);
      return 0.65 * blades + 0.35 * rad;
    }
    case 22: { // S_BITHREAD
      const d1 = Math.abs(frac1(fu + fv) - 0.5) * 2.0;
      const d2 = Math.abs(frac1(fu - fv) - 0.5) * 2.0;
      return par ? 0.75 * d1 + 0.25 * d2 : 0.25 * d1 + 0.75 * d2;
    }
    case 23: { // S_KNIT
      const vloop = fv + Math.abs(du) * 1.35 - 0.32;
      const d1 = Math.abs(frac1(vloop) - 0.5) * 2.0;
      const rib = Math.abs(du) * 0.55;
      return d1 * 0.78 + rib * 0.22;
    }
  }
  return 0.5;
}

// Cache of built screen maps (64x64 rank normalized)
const screenMapCache = new Map<number, Float32Array>();

function getScreenMap(id: number): Float32Array {
  if (screenMapCache.has(id)) {
    return screenMapCache.get(id)!;
  }
  const M = 64;
  const raw = new Float32Array(M * M);
  const indices = new Int32Array(M * M);

  for (let y = 0; y < M; ++y) {
    for (let x = 0; x < M; ++x) {
      const u2 = (x + 0.5) * (2.0 / M);
      const v2 = (y + 0.5) * (2.0 / M);
      let pu = Math.floor(u2);
      if (pu > 1) pu = 1;
      let pv = Math.floor(v2);
      if (pv > 1) pv = 1;
      const fu = u2 - pu;
      const fv = v2 - pv;
      const tie = (u01(hash3(x, y, 0x5c8ee4)) - 0.5) * 1e-4;
      const val = spotFunction(id, fu, fv, pu, pv) + tie;
      const idx = y * M + x;
      raw[idx] = val;
      indices[idx] = idx;
    }
  }

  // Rank normalize
  const sorted = Array.from(indices).sort((a, b) => raw[a] - raw[b]);
  const sm = new Float32Array(M * M);
  const invN = 1.0 / (M * M);
  for (let r = 0; r < sorted.length; ++r) {
    sm[sorted[r]] = 1.0 - (r + 0.5) * invN;
  }

  screenMapCache.set(id, sm);
  return sm;
}

function sampleScreenMap(sm: Float32Array, u2: number, v2: number): number {
  let tu = u2 * 0.5;
  tu = tu - Math.floor(tu);
  let tv = v2 * 0.5;
  tv = tv - Math.floor(tv);

  const fx = clamp(tu * 64.0 - 0.5, 0, 63.999);
  const fy = clamp(tv * 64.0 - 0.5, 0, 63.999);
  const x0 = Math.floor(fx) & 63;
  const y0 = Math.floor(fy) & 63;
  const x1 = (x0 + 1) & 63;
  const y1 = (y0 + 1) & 63;

  const dx = fx - Math.floor(fx);
  const dy = fy - Math.floor(fy);

  const a = sm[y0 * 64 + x0];
  const b = sm[y0 * 64 + x1];
  const c = sm[y1 * 64 + x0];
  const d = sm[y1 * 64 + x1];

  return lerp(lerp(a, b, dx), lerp(c, d, dx), dy);
}

// ---------------------------------------------------------------------------
// BAYER MATRIX
// ---------------------------------------------------------------------------
function bayerThreshold(x: number, y: number, n: number): number {
  const bits = n <= 2 ? 1 : n <= 4 ? 2 : n <= 8 ? 3 : 4;
  const mask = (1 << bits) - 1;
  const ux = x & mask;
  const uy = y & mask;
  let val = 0;
  for (let b = 0; b < bits; ++b) {
    const bx = (ux >> (bits - 1 - b)) & 1;
    const by = (uy >> (bits - 1 - b)) & 1;
    const digit = (bx ^ by) | (by << 1);
    val = (val << 2) | digit;
  }
  const total = 1 << (2 * bits);
  return (val + 0.5) / total;
}

// ---------------------------------------------------------------------------
// BLUE NOISE APPROXIMATION
// ---------------------------------------------------------------------------
function blueNoiseThreshold(x: number, y: number, seed: number): number {
  const ux = ((x % 64) + 64) % 64;
  const uy = ((y % 64) + 64) % 64;

  const cellR2 = (cx: number, cy: number) => {
    cx = (cx + 64) & 63;
    cy = (cy + 64) & 63;
    const q = cx * 0.7548776662466927 + cy * 0.5698402909980532;
    const r2 = q - Math.floor(q);
    const h = u01(hash3(cx, cy, seed ^ 0xb10e64));
    return 0.65 * r2 + 0.35 * h;
  };

  const c0 = cellR2(ux, uy);
  let neigh = cellR2(ux - 1, uy) + cellR2(ux + 1, uy) + cellR2(ux, uy - 1) + cellR2(ux, uy + 1);
  neigh += 0.707 * (cellR2(ux - 1, uy - 1) + cellR2(ux + 1, uy - 1) + cellR2(ux - 1, uy + 1) + cellR2(ux + 1, uy + 1));
  neigh /= 6.828;

  const hp = (c0 - neigh) * 2.65;
  const cdf = 0.5 + 0.5 * Math.tanh(hp * 1.15);
  let u = c0 + 0.5 * (c0 - neigh);
  u = u - Math.floor(u);
  return clamp(0.55 * cdf + 0.45 * u, 0.001, 0.999);
}

// ---------------------------------------------------------------------------
// ERROR DIFFUSION KERNELS
// ---------------------------------------------------------------------------
interface Tap { dx: number; dy: number; w: number; }
const ERROR_KERNELS: Tap[][] = [
  // 0: Floyd-Steinberg
  [
    { dx: 1, dy: 0, w: 7 / 16 },
    { dx: -1, dy: 1, w: 3 / 16 },
    { dx: 0, dy: 1, w: 5 / 16 },
    { dx: 1, dy: 1, w: 1 / 16 }
  ],
  // 1: Jarvis-Judice-Ninke
  [
    { dx: 1, dy: 0, w: 7 / 48 }, { dx: 2, dy: 0, w: 5 / 48 },
    { dx: -2, dy: 1, w: 3 / 48 }, { dx: -1, dy: 1, w: 5 / 48 }, { dx: 0, dy: 1, w: 7 / 48 }, { dx: 1, dy: 1, w: 5 / 48 }, { dx: 2, dy: 1, w: 3 / 48 },
    { dx: -2, dy: 2, w: 1 / 48 }, { dx: -1, dy: 2, w: 3 / 48 }, { dx: 0, dy: 2, w: 5 / 48 }, { dx: 1, dy: 2, w: 3 / 48 }, { dx: 2, dy: 2, w: 1 / 48 }
  ],
  // 2: Stucki
  [
    { dx: 1, dy: 0, w: 8 / 42 }, { dx: 2, dy: 0, w: 4 / 42 },
    { dx: -2, dy: 1, w: 2 / 42 }, { dx: -1, dy: 1, w: 4 / 42 }, { dx: 0, dy: 1, w: 8 / 42 }, { dx: 1, dy: 1, w: 4 / 42 }, { dx: 2, dy: 1, w: 2 / 42 },
    { dx: -2, dy: 2, w: 1 / 42 }, { dx: -1, dy: 2, w: 2 / 42 }, { dx: 0, dy: 2, w: 4 / 42 }, { dx: 1, dy: 2, w: 2 / 42 }, { dx: 2, dy: 2, w: 1 / 42 }
  ],
  // 3: Atkinson
  [
    { dx: 1, dy: 0, w: 1 / 8 }, { dx: 2, dy: 0, w: 1 / 8 },
    { dx: -1, dy: 1, w: 1 / 8 }, { dx: 0, dy: 1, w: 1 / 8 }, { dx: 1, dy: 1, w: 1 / 8 },
    { dx: 0, dy: 2, w: 1 / 8 }
  ],
  // 4: Burkes
  [
    { dx: 1, dy: 0, w: 8 / 32 }, { dx: 2, dy: 0, w: 4 / 32 },
    { dx: -2, dy: 1, w: 2 / 32 }, { dx: -1, dy: 1, w: 4 / 32 }, { dx: 0, dy: 1, w: 8 / 32 }, { dx: 1, dy: 1, w: 4 / 32 }, { dx: 2, dy: 1, w: 2 / 32 }
  ],
  // 5: Sierra (Sierra-3)
  [
    { dx: 1, dy: 0, w: 5 / 32 }, { dx: 2, dy: 0, w: 3 / 32 },
    { dx: -2, dy: 1, w: 2 / 32 }, { dx: -1, dy: 1, w: 4 / 32 }, { dx: 0, dy: 1, w: 5 / 32 }, { dx: 1, dy: 1, w: 4 / 32 }, { dx: 2, dy: 1, w: 2 / 32 },
    { dx: -1, dy: 2, w: 2 / 32 }, { dx: 0, dy: 2, w: 3 / 32 }, { dx: 1, dy: 2, w: 2 / 32 }
  ],
  // 6: Sierra Two Row
  [
    { dx: 1, dy: 0, w: 4 / 16 }, { dx: 2, dy: 0, w: 3 / 16 },
    { dx: -2, dy: 1, w: 1 / 16 }, { dx: -1, dy: 1, w: 2 / 16 }, { dx: 0, dy: 1, w: 3 / 16 }, { dx: 1, dy: 1, w: 2 / 16 }, { dx: 2, dy: 1, w: 1 / 16 }
  ],
  // 7: Sierra Lite
  [
    { dx: 1, dy: 0, w: 2 / 4 },
    { dx: -1, dy: 1, w: 1 / 4 },
    { dx: 0, dy: 1, w: 1 / 4 }
  ],
  // 8: Fan
  [
    { dx: 1, dy: 0, w: 7 / 16 },
    { dx: -2, dy: 1, w: 1 / 16 },
    { dx: -1, dy: 1, w: 3 / 16 },
    { dx: 0, dy: 1, w: 5 / 16 }
  ],
  // 9: Shiau-Fan
  [
    { dx: 1, dy: 0, w: 8 / 16 },
    { dx: -3, dy: 1, w: 1 / 16 },
    { dx: -2, dy: 1, w: 1 / 16 },
    { dx: -1, dy: 1, w: 2 / 16 },
    { dx: 0, dy: 1, w: 4 / 16 }
  ],
  // 10: Skip Neighbours
  [
    { dx: 2, dy: 0, w: 7 / 16 },
    { dx: -2, dy: 2, w: 3 / 16 },
    { dx: 0, dy: 2, w: 5 / 16 },
    { dx: 2, dy: 2, w: 1 / 16 }
  ],
  // 11: Skip1 Neighbours
  [
    { dx: 3, dy: 0, w: 6 / 16 },
    { dx: -3, dy: 2, w: 3 / 16 },
    { dx: 0, dy: 3, w: 4 / 16 },
    { dx: 3, dy: 2, w: 2 / 16 },
    { dx: 0, dy: 1, w: 1 / 16 }
  ],
  // 12: Skip2 Neighbours
  [
    { dx: 4, dy: 0, w: 6 / 16 },
    { dx: -4, dy: 3, w: 3 / 16 },
    { dx: 0, dy: 4, w: 4 / 16 },
    { dx: 4, dy: 3, w: 2 / 16 },
    { dx: 2, dy: 1, w: 1 / 16 }
  ]
];

// ---------------------------------------------------------------------------
// PRE-PROCESSING FILTERS
// ---------------------------------------------------------------------------
export function applyLevels(data: Uint8ClampedArray, width: number, height: number, levels: LevelsConfig) {
  const lut = new Uint8Array(256);
  const inLow = levels.shadow;
  const inHigh = levels.highlight;
  const gamma = Math.max(0.1, levels.mid);
  const outLow = levels.blackClip;
  const outHigh = levels.whiteClip;
  const invGamma = 1.0 / gamma;

  for (let i = 0; i < 256; i++) {
    // Map inLow..inHigh to 0..1
    let norm = (i - inLow) / Math.max(1, inHigh - inLow);
    norm = clamp(norm, 0, 1);
    // Apply gamma
    norm = Math.pow(norm, invGamma);
    // Map to outLow..outHigh
    const out = outLow + norm * (outHigh - outLow);
    lut[i] = clamp(Math.round(out), 0, 255);
  }

  const len = width * height * 4;
  for (let i = 0; i < len; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}

export function applySharpen(data: Uint8ClampedArray, width: number, height: number, strength: number, radius: number) {
  if (strength <= 0) return;
  const str = strength / 100.0;
  const copy = new Uint8ClampedArray(data);
  const rad = Math.max(1, Math.min(4, Math.round(radius / 25)));

  for (let y = rad; y < height - rad; y++) {
    for (let x = rad; x < width - rad; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        // Neighborhood average
        const up = copy[((y - rad) * width + x) * 4 + c];
        const down = copy[((y + rad) * width + x) * 4 + c];
        const left = copy[(y * width + (x - rad)) * 4 + c];
        const right = copy[(y * width + (x + rad)) * 4 + c];
        const avg = (up + down + left + right) * 0.25;
        const diff = center - avg;
        data[idx + c] = clamp(Math.round(center + diff * str * 1.5), 0, 255);
      }
    }
  }
}

export function applyNoiseOrDenoise(data: Uint8ClampedArray, width: number, height: number, noise: number) {
  if (noise === 0) return;
  const len = width * height * 4;

  if (noise > 0) {
    // Add film grain noise
    const amount = (noise / 100.0) * 80;
    for (let i = 0; i < len; i += 4) {
      const n = (Math.random() - 0.5) * amount;
      data[i] = clamp(data[i] + n, 0, 255);
      data[i + 1] = clamp(data[i + 1] + n, 0, 255);
      data[i + 2] = clamp(data[i + 2] + n, 0, 255);
    }
  } else {
    // Denoise (smart 3x3 median)
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          const vals: number[] = [];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              vals.push(copy[((y + dy) * width + (x + dx)) * 4 + c]);
            }
          }
          vals.sort((a, b) => a - b);
          const median = vals[4];
          const blend = -noise / 25.0; // 0..1
          data[idx + c] = Math.round(lerp(copy[idx + c], median, blend));
        }
      }
    }
  }
}

export function applyBlur(data: Uint8ClampedArray, width: number, height: number, blurRadius: number) {
  if (blurRadius <= 0) return;
  const r = Math.min(6, Math.max(1, Math.round(blurRadius / 5)));
  const copy = new Uint8ClampedArray(data);

  // Fast box blur approximation
  for (let y = r; y < height - r; y++) {
    for (let x = r; x < width - r; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -r; dy <= r; dy += r) {
        for (let dx = -r; dx <= r; dx += r) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          rSum += copy[idx];
          gSum += copy[idx + 1];
          bSum += copy[idx + 2];
          count++;
        }
      }
      const outIdx = (y * width + x) * 4;
      data[outIdx] = rSum / count;
      data[outIdx + 1] = gSum / count;
      data[outIdx + 2] = bSum / count;
    }
  }
}

export function applyHueSaturation(data: Uint8ClampedArray, width: number, height: number, hueDeg: number, satPct: number, invert: boolean) {
  if (hueDeg === 0 && satPct === 0 && !invert) return;
  const len = width * height * 4;
  const hueRad = (hueDeg * Math.PI) / 180;
  const cosH = Math.cos(hueRad);
  const sinH = Math.sin(hueRad);
  const satMult = 1 + satPct / 100.0;

  for (let i = 0; i < len; i += 4) {
    let r = data[i] / 255.0;
    let g = data[i + 1] / 255.0;
    let b = data[i + 2] / 255.0;

    if (invert) {
      r = 1.0 - r;
      g = 1.0 - g;
      b = 1.0 - b;
    }

    // Convert to YIQ for clean hue/sat rotation
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    let u = -0.14713 * r - 0.28886 * g + 0.436 * b;
    let v = 0.615 * r - 0.51499 * g - 0.10001 * b;

    // Rotate hue and scale saturation
    const newU = (u * cosH - v * sinH) * satMult;
    const newV = (u * sinH + v * cosH) * satMult;

    // Convert back to RGB
    const finalR = clamp(y + 1.13983 * newV, 0, 1);
    const finalG = clamp(y - 0.39465 * newU - 0.5806 * newV, 0, 1);
    const finalB = clamp(y + 2.03211 * newU, 0, 1);

    data[i] = Math.round(finalR * 255);
    data[i + 1] = Math.round(finalG * 255);
    data[i + 2] = Math.round(finalB * 255);
  }
}

// ---------------------------------------------------------------------------
// MAIN CORE DITHER ENGINE PIPELINE
// ---------------------------------------------------------------------------
export function processDither(
  sourceImageData: ImageData,
  params: DitherParams
): ImageData {
  const width = sourceImageData.width;
  const height = sourceImageData.height;
  const output = new ImageData(new Uint8ClampedArray(sourceImageData.data), width, height);
  const data = output.data;

  // 1. Run Pre-processing filters
  applyLevels(data, width, height, params.levels);
  applySharpen(data, width, height, params.sharpenStrength, params.sharpenRadius);
  applyNoiseOrDenoise(data, width, height, params.noise);
  applyBlur(data, width, height, params.blur);
  applyHueSaturation(data, width, height, params.hue, params.saturation, params.invert);

  // 2. Algorithm lookup
  const algo = ALGORITHMS.find(a => a.id === params.algoId) || ALGORITHMS[0];
  const L = Math.max(2, Math.min(64, params.levelsCount));
  const contrast = params.contrast / 100.0;
  const bright = params.brightness / 100.0;
  const bias = ((50.0 - clamp(params.threshold, 0, 100)) / 50.0) * 0.45;
  const spread = clamp(params.strength / 100.0, 0, 2.5);
  const ditherScale = Math.max(1.0, params.scale * (params.dpi / 300.0));
  const masterAmount = clamp(params.amount / 100.0, 0, 1);
  const whiteCov = clamp(params.whiteAmount / 100.0, 0, 1);
  const blackCov = clamp(params.blackAmount / 100.0, 0, 1);
  const seed = hash3(params.seed, 0, 0xd17e5);

  // Setup palette colors for Tonal / Color Grade mode
  const highlightRgb = hexToRgb(params.highlightColor);
  const midtoneRgb = hexToRgb(params.midtoneColor);
  const shadowRgb = hexToRgb(params.shadowColor);
  const bgRgb = hexToRgb(params.backgroundColor);

  // Prepared indexed palette if in Color Grade -> Indexed mode
  let activePalette: Array<[number, number, number]> = [];
  if (params.renderMode === 'color_grade' && params.colorspace === 'indexed') {
    const preset = PALETTE_PRESETS.find(p => p.id === params.palettePreset) || PALETTE_PRESETS[0];
    const colorsHex = params.customPalette && params.customPalette.length > 0 ? params.customPalette : preset.colors;
    activePalette = colorsHex.slice(0, params.indexedColorCount).map(hexToRgb);
  }

  // -------------------------------------------------------------------------
  // CONTINUOUS SCREEN, ORDERED BAYER, BLUE NOISE, IGN, WHITE NOISE
  // -------------------------------------------------------------------------
  if (['screen', 'bayer', 'blue', 'ign', 'white'].includes(algo.kind)) {
    let sm: Float32Array | null = null;
    let pitch = 6.0;
    if (algo.kind === 'screen') {
      sm = getScreenMap(algo.param);
      pitch = Math.max(1.0, (algo.cell || 8) * ditherScale * Math.max(10, params.patternScale) / 100.0);
    }
    const bayN = Math.max(2, algo.param);
    const nch = params.renderMode === 'color_grade' && params.colorspace === 'rgb' ? 3 : params.renderMode === 'cmyk' ? 4 : 1;

    // Angle rotation for channels
    const cmykAngles = [15.0, 75.0, 0.0, 45.0];
    const cosCh = new Float32Array(nch);
    const sinCh = new Float32Array(nch);
    for (let k = 0; k < nch; ++k) {
      const angDeg = (algo.angle || 0) + params.patternAngle + (nch === 4 ? cmykAngles[k] : 0);
      const rad = (angDeg * Math.PI) / 180.0;
      cosCh[k] = Math.cos(rad);
      sinCh[k] = Math.sin(rad);
    }

    const orig = new Uint8ClampedArray(data);

    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const idx = (y * width + x) * 4;
        let r = orig[idx] / 255.0;
        let g = orig[idx + 1] / 255.0;
        let b = orig[idx + 2] / 255.0;
        const a = orig[idx + 3];

        // Apply contrast & brightness
        r = clamp((r - 0.5) * contrast + 0.5 + bright, 0, 1);
        g = clamp((g - 0.5) * contrast + 0.5 + bright, 0, 1);
        b = clamp((b - 0.5) * contrast + 0.5 + bright, 0, 1);

        const chVal = new Float32Array(4);
        if (nch === 1) {
          chVal[0] = luma709(r, g, b);
        } else if (nch === 3) {
          chVal[0] = r; chVal[1] = g; chVal[2] = b;
        } else {
          // CMYK
          const kInk = 1.0 - Math.max(r, Math.max(g, b));
          const invOneMinusK = 1.0 - kInk > 1e-5 ? 1.0 / (1.0 - kInk) : 0;
          chVal[0] = clamp(1.0 - (1.0 - r - kInk) * invOneMinusK, 0, 1); // C
          chVal[1] = clamp(1.0 - (1.0 - g - kInk) * invOneMinusK, 0, 1); // M
          chVal[2] = clamp(1.0 - (1.0 - b - kInk) * invOneMinusK, 0, 1); // Y
          chVal[3] = clamp(1.0 - kInk, 0, 1); // K
        }

        const outCh = new Float32Array(4);
        for (let k = 0; k < nch; ++k) {
          let T = 0.5;
          const chSeed = seed + k * 0x9e37;

          switch (algo.kind) {
            case 'bayer': {
              const bx = Math.floor(x / ditherScale) + (nch === 4 ? k * 3 : 0);
              const by = Math.floor(y / ditherScale) + (nch === 4 ? k * 5 : 0);
              T = bayerThreshold(bx, by, bayN);
              break;
            }
            case 'blue': {
              const bx = Math.floor(x / ditherScale) + k * 17;
              const by = Math.floor(y / ditherScale) + k * 29;
              T = blueNoiseThreshold(bx, by, chSeed);
              break;
            }
            case 'ign': {
              let f = 0.06711056 * (x / ditherScale + k * 11) + 0.00583715 * (y / ditherScale + k * 19);
              f = f - Math.floor(f);
              f = f * 52.9829189;
              T = f - Math.floor(f);
              break;
            }
            case 'white': {
              const bx = Math.floor(x / ditherScale);
              const by = Math.floor(y / ditherScale);
              T = u01(hash3(bx, by, chSeed));
              break;
            }
            case 'screen': {
              if (sm) {
                const xs = x + 0.5;
                const ys = y + 0.5;
                const u2 = (xs * cosCh[k] + ys * sinCh[k]) / pitch;
                const v2 = (-xs * sinCh[k] + ys * cosCh[k]) / pitch;
                T = sampleScreenMap(sm, u2, v2);
              }
              break;
            }
          }

          // Modulation spread and quantization
          T = clamp(0.5 + (T - 0.5) * spread, 0.001, 0.999);
          const val = clamp(chVal[k] + bias, 0, 1);
          const scaled = val * (L - 1);
          const q = Math.floor(scaled + T);
          outCh[k] = clamp(q / (L - 1), 0, 1);
        }

        // Color mapping according to active Render Mode
        let finalR = 0, finalG = 0, finalB = 0, finalA = a;

        if (params.renderMode === 'tonal') {
          const luma = outCh[0];
          const rawLuma = luma709(orig[idx] / 255, orig[idx + 1] / 255, orig[idx + 2] / 255) * 255;
          const hThresh = params.highlightThreshold;
          const mThresh = params.midtoneThreshold;
          const sThresh = params.shadowThreshold;

          if (params.tonalCount === 1) {
            // 1 Color (Single ink)
            if (luma >= 0.5) {
              finalR = highlightRgb[0]; finalG = highlightRgb[1]; finalB = highlightRgb[2];
            } else {
              finalR = bgRgb[0]; finalG = bgRgb[1]; finalB = bgRgb[2];
              if (params.knockoutBg) finalA = 0;
            }
          } else if (params.tonalCount === 2) {
            // 2 Color (Highlights & Shadows)
            if (rawLuma >= hThresh && luma >= 0.5) {
              finalR = highlightRgb[0]; finalG = highlightRgb[1]; finalB = highlightRgb[2];
            } else {
              finalR = shadowRgb[0]; finalG = shadowRgb[1]; finalB = shadowRgb[2];
            }
          } else {
            // 3 Color (Highlights, Midtones, Shadows)
            if (rawLuma >= hThresh && luma >= 0.5) {
              finalR = highlightRgb[0]; finalG = highlightRgb[1]; finalB = highlightRgb[2];
            } else if (rawLuma >= sThresh) {
              finalR = midtoneRgb[0]; finalG = midtoneRgb[1]; finalB = midtoneRgb[2];
            } else {
              finalR = shadowRgb[0]; finalG = shadowRgb[1]; finalB = shadowRgb[2];
            }
          }
        } else if (params.renderMode === 'monochrome') {
          const v = outCh[0] >= 0.5 ? 255 : 0;
          finalR = v; finalG = v; finalB = v;
        } else if (params.renderMode === 'duotone') {
          const t = outCh[0];
          finalR = Math.round(lerp(shadowRgb[0], highlightRgb[0], t));
          finalG = Math.round(lerp(shadowRgb[1], highlightRgb[1], t));
          finalB = Math.round(lerp(shadowRgb[2], highlightRgb[2], t));
        } else if (params.renderMode === 'cmyk') {
          const kMul = outCh[3];
          finalR = Math.round(clamp(outCh[0] * kMul, 0, 1) * 255);
          finalG = Math.round(clamp(outCh[1] * kMul, 0, 1) * 255);
          finalB = Math.round(clamp(outCh[2] * kMul, 0, 1) * 255);
        } else {
          // Color Grade
          if (params.colorspace === 'gray') {
            const v = Math.round(outCh[0] * 255);
            finalR = v; finalG = v; finalB = v;
          } else if (params.colorspace === 'rgb') {
            finalR = Math.round(outCh[0] * 255);
            finalG = Math.round(outCh[1] * 255);
            finalB = Math.round(outCh[2] * 255);
          } else {
            // Indexed Palette
            if (activePalette.length > 0) {
              // Find closest palette color with optional spread modulation
              const modSpread = (params.spread / 100.0) * (outCh[0] - 0.5) * 50;
              const targetR = clamp(r * 255 + modSpread, 0, 255);
              const targetG = clamp(g * 255 + modSpread, 0, 255);
              const targetB = clamp(b * 255 + modSpread, 0, 255);

              let bestDist = Infinity;
              let bestColor = activePalette[0];
              for (const col of activePalette) {
                const dr = targetR - col[0];
                const dg = targetG - col[1];
                const db = targetB - col[2];
                const dist = dr * dr + dg * dg + db * db;
                if (dist < bestDist) {
                  bestDist = dist;
                  bestColor = col;
                }
              }
              finalR = bestColor[0]; finalG = bestColor[1]; finalB = bestColor[2];
            }
          }
        }

        // True Dot Density Gating (Amount, White Amount, Black Amount)
        let prob = masterAmount;
        let gateSeed = 0x51a7;
        if (params.renderMode === 'monochrome') {
          if (outCh[0] >= 0.5) {
            prob = masterAmount * whiteCov;
            gateSeed = 0x93e1;
          } else {
            prob = masterAmount * blackCov;
            gateSeed = 0x48d2;
          }
        }

        const gate = u01(hash3(x, y, seed ^ gateSeed));
        if (gate < prob) {
          data[idx] = finalR;
          data[idx + 1] = finalG;
          data[idx + 2] = finalB;
          data[idx + 3] = finalA;
        } else {
          // Retain original image pixel
          data[idx] = orig[idx];
          data[idx + 1] = orig[idx + 1];
          data[idx + 2] = orig[idx + 2];
          data[idx + 3] = orig[idx + 3];
        }
      }
    }
    return output;
  }

  // -------------------------------------------------------------------------
  // ERROR DIFFUSION PIPELINE
  // -------------------------------------------------------------------------
  const block = (params.pixelate && ditherScale > 1.0) ? Math.max(1, Math.round(ditherScale)) : 1;
  const gw = Math.max(1, Math.floor((width + block - 1) / block));
  const gh = Math.max(1, Math.floor((height + block - 1) / block));

  const nch = params.renderMode === 'color_grade' && params.colorspace === 'rgb' ? 3 : params.renderMode === 'cmyk' ? 4 : 1;
  const planes: Float32Array[] = [];
  for (let c = 0; c < nch; ++c) {
    planes.push(new Float32Array(gw * gh));
  }

  // Downsample to grid
  const orig = new Uint8ClampedArray(data);
  for (let gy = 0; gy < gh; ++gy) {
    for (let gx = 0; gx < gw; ++gx) {
      let r = 0, g = 0, b = 0;
      if (block <= 1) {
        const idx = (gy * width + gx) * 4;
        r = orig[idx] / 255.0;
        g = orig[idx + 1] / 255.0;
        b = orig[idx + 2] / 255.0;
      } else {
        let accR = 0, accG = 0, accB = 0, cnt = 0;
        const xStart = gx * block;
        const yStart = gy * block;
        const xe = Math.min(width, xStart + block);
        const ye = Math.min(height, yStart + block);
        for (let y = yStart; y < ye; ++y) {
          for (let x = xStart; x < xe; ++x) {
            const idx = (y * width + x) * 4;
            accR += orig[idx];
            accG += orig[idx + 1];
            accB += orig[idx + 2];
            cnt++;
          }
        }
        const inv = cnt > 0 ? 1.0 / (cnt * 255.0) : 0;
        r = accR * inv; g = accG * inv; b = accB * inv;
      }

      r = clamp((r - 0.5) * contrast + 0.5 + bright, 0, 1);
      g = clamp((g - 0.5) * contrast + 0.5 + bright, 0, 1);
      b = clamp((b - 0.5) * contrast + 0.5 + bright, 0, 1);

      const gi = gy * gw + gx;
      if (nch === 1) {
        planes[0][gi] = luma709(r, g, b);
      } else if (nch === 3) {
        planes[0][gi] = r; planes[1][gi] = g; planes[2][gi] = b;
      } else {
        const kInk = 1.0 - Math.max(r, Math.max(g, b));
        const invOneMinusK = 1.0 - kInk > 1e-5 ? 1.0 / (1.0 - kInk) : 0;
        planes[0][gi] = clamp(1.0 - (1.0 - r - kInk) * invOneMinusK, 0, 1);
        planes[1][gi] = clamp(1.0 - (1.0 - g - kInk) * invOneMinusK, 0, 1);
        planes[2][gi] = clamp(1.0 - (1.0 - b - kInk) * invOneMinusK, 0, 1);
        planes[3][gi] = clamp(1.0 - kInk, 0, 1);
      }
    }
  }

  // Diffuse each channel
  const kid = algo.param & 255;
  const taps = ERROR_KERNELS[Math.min(ERROR_KERNELS.length - 1, kid)] || ERROR_KERNELS[0];
  const serp = params.serpentine || ((algo.param & 256) !== 0);
  const xerox = (algo.param & 1024) !== 0;

  for (let k = 0; k < nch; ++k) {
    const pl = planes[k];

    // Xerox edge boost
    if (xerox && gw > 2 && gh > 2) {
      const origPl = new Float32Array(pl);
      for (let y = 1; y < gh - 1; ++y) {
        for (let x = 1; x < gw - 1; ++x) {
          const c = origPl[y * gw + x];
          const lap = 4 * c - origPl[(y - 1) * gw + x] - origPl[(y + 1) * gw + x] - origPl[y * gw + (x - 1)] - origPl[y * gw + (x + 1)];
          pl[y * gw + x] = clamp(c + lap * 0.55, 0, 1);
        }
      }
    }

    // Diffusion scan
    for (let y = 0; y < gh; ++y) {
      const rev = serp && (y & 1) !== 0;
      for (let i = 0; i < gw; ++i) {
        const x = rev ? gw - 1 - i : i;
        const gi = y * gw + x;
        const v = clamp(pl[gi], -0.35, 1.35);

        // Quantization with bias
        const biased = clamp(v + bias, 0, 1);
        const q = Math.floor(biased * (L - 1) + 0.5) / (L - 1);
        const err = clamp((v - q) * spread, -1.0, 1.0);
        pl[gi] = q;

        // Distribute error to taps
        for (const tap of taps) {
          const nx = x + (rev ? -tap.dx : tap.dx);
          const ny = y + tap.dy;
          if (nx >= 0 && nx < gw && ny >= 0 && ny < gh) {
            pl[ny * gw + nx] += err * tap.w;
          }
        }
      }
    }
  }

  // Map diffused planes back to pixels with full tonal & density controls
  for (let y = 0; y < height; ++y) {
    const gy = Math.min(gh - 1, Math.floor(y / block));
    for (let x = 0; x < width; ++x) {
      const gx = Math.min(gw - 1, Math.floor(x / block));
      const gi = gy * gw + gx;
      const idx = (y * width + x) * 4;

      const outCh = new Float32Array(4);
      for (let k = 0; k < nch; ++k) {
        outCh[k] = clamp(planes[k][gi], 0, 1);
      }

      let finalR = 0, finalG = 0, finalB = 0, finalA = orig[idx + 3];

      if (params.renderMode === 'tonal') {
        const luma = outCh[0];
        const rawLuma = luma709(orig[idx] / 255, orig[idx + 1] / 255, orig[idx + 2] / 255) * 255;
        const hThresh = params.highlightThreshold;
        const sThresh = params.shadowThreshold;

        if (params.tonalCount === 1) {
          if (luma >= 0.5) {
            finalR = highlightRgb[0]; finalG = highlightRgb[1]; finalB = highlightRgb[2];
          } else {
            finalR = bgRgb[0]; finalG = bgRgb[1]; finalB = bgRgb[2];
            if (params.knockoutBg) finalA = 0;
          }
        } else if (params.tonalCount === 2) {
          if (rawLuma >= hThresh && luma >= 0.5) {
            finalR = highlightRgb[0]; finalG = highlightRgb[1]; finalB = highlightRgb[2];
          } else {
            finalR = shadowRgb[0]; finalG = shadowRgb[1]; finalB = shadowRgb[2];
          }
        } else {
          if (rawLuma >= hThresh && luma >= 0.5) {
            finalR = highlightRgb[0]; finalG = highlightRgb[1]; finalB = highlightRgb[2];
          } else if (rawLuma >= sThresh) {
            finalR = midtoneRgb[0]; finalG = midtoneRgb[1]; finalB = midtoneRgb[2];
          } else {
            finalR = shadowRgb[0]; finalG = shadowRgb[1]; finalB = shadowRgb[2];
          }
        }
      } else if (params.renderMode === 'monochrome') {
        const v = outCh[0] >= 0.5 ? 255 : 0;
        finalR = v; finalG = v; finalB = v;
      } else if (params.renderMode === 'duotone') {
        const t = outCh[0];
        finalR = Math.round(lerp(shadowRgb[0], highlightRgb[0], t));
        finalG = Math.round(lerp(shadowRgb[1], highlightRgb[1], t));
        finalB = Math.round(lerp(shadowRgb[2], highlightRgb[2], t));
      } else if (params.renderMode === 'cmyk') {
        const kMul = outCh[3];
        finalR = Math.round(clamp(outCh[0] * kMul, 0, 1) * 255);
        finalG = Math.round(clamp(outCh[1] * kMul, 0, 1) * 255);
        finalB = Math.round(clamp(outCh[2] * kMul, 0, 1) * 255);
      } else {
        // Color Grade
        if (params.colorspace === 'gray') {
          const v = Math.round(outCh[0] * 255);
          finalR = v; finalG = v; finalB = v;
        } else if (params.colorspace === 'rgb') {
          finalR = Math.round(outCh[0] * 255);
          finalG = Math.round(outCh[1] * 255);
          finalB = Math.round(outCh[2] * 255);
        } else {
          // Indexed
          if (activePalette.length > 0) {
            const tr = orig[idx];
            const tg = orig[idx + 1];
            const tb = orig[idx + 2];
            let bestDist = Infinity;
            let bestColor = activePalette[0];
            for (const col of activePalette) {
              const dr = tr - col[0];
              const dg = tg - col[1];
              const db = tb - col[2];
              const dist = dr * dr + dg * dg + db * db;
              if (dist < bestDist) {
                bestDist = dist;
                bestColor = col;
              }
            }
            finalR = bestColor[0]; finalG = bestColor[1]; finalB = bestColor[2];
          }
        }
      }

      // Density gating
      let prob = masterAmount;
      let gateSeed = 0x51a7;
      if (params.renderMode === 'monochrome') {
        if (outCh[0] >= 0.5) {
          prob = masterAmount * whiteCov;
          gateSeed = 0x93e1;
        } else {
          prob = masterAmount * blackCov;
          gateSeed = 0x48d2;
        }
      }

      const gate = u01(hash3(x, y, seed ^ gateSeed));
      if (gate < prob) {
        data[idx] = finalR;
        data[idx + 1] = finalG;
        data[idx + 2] = finalB;
        data[idx + 3] = finalA;
      } else {
        data[idx] = orig[idx];
        data[idx + 1] = orig[idx + 1];
        data[idx + 2] = orig[idx + 2];
        data[idx + 3] = orig[idx + 3];
      }
    }
  }

  return output;
}
