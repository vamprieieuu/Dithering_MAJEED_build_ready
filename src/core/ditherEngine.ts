import { AlgorithmDef, DitherParams, DitherColorMode } from '../types/dither';

// ---------------------------------------------------------------------------
// 49 NATIVE ALGORITHMS DEFINITION (1:1 with core/dither.cpp & ae/DitherAlgoList.h)
// ---------------------------------------------------------------------------
export const ALGORITHMS: AlgorithmDef[] = [
  // 15 Error Diffusion algorithms
  { id: 0,  name: 'Floyd-Steinberg',            category: 'DIFFUSION',  kind: 'ERROR',  param: 0,   description: 'Classic 4-tap error diffusion (7-3-5-1 /16)' },
  { id: 1,  name: 'Floyd-Steinberg Serpentine', category: 'DIFFUSION',  kind: 'ERROR',  param: 0,   isSerpentineDefault: true, description: 'Floyd-Steinberg with alternating bidirectional scanlines' },
  { id: 2,  name: 'Jarvis-Judice-Ninke',        category: 'DIFFUSION',  kind: 'ERROR',  param: 1,   description: '3-row 12-tap smooth kernel /48 for rich tone preservation' },
  { id: 3,  name: 'Stucki',                     category: 'DIFFUSION',  kind: 'ERROR',  param: 2,   description: '3-row 12-tap sharp edge diffusion /42' },
  { id: 4,  name: 'Atkinson',                   category: 'DIFFUSION',  kind: 'ERROR',  param: 3,   description: 'Diffuses only 6/8 of error for ultra-crisp Mac 1-bit high-contrast aesthetic' },
  { id: 5,  name: 'Burkes',                     category: 'DIFFUSION',  kind: 'ERROR',  param: 4,   description: '2-row 7-tap fast error diffusion /32' },
  { id: 6,  name: 'Sierra',                     category: 'DIFFUSION',  kind: 'ERROR',  param: 5,   description: 'Sierra-3, 3-row 10-tap high-fidelity kernel /32' },
  { id: 7,  name: 'Sierra Two Row',             category: 'DIFFUSION',  kind: 'ERROR',  param: 6,   description: 'Sierra-2, 2-row 7-tap balanced kernel /16' },
  { id: 8,  name: 'Sierra Lite',                category: 'DIFFUSION',  kind: 'ERROR',  param: 7,   description: 'Sierra Lite, lightweight 3-tap kernel 2-1-1 /4' },
  { id: 9,  name: 'Fan',                        category: 'DIFFUSION',  kind: 'ERROR',  param: 8,   description: 'Fan error diffusion 7 / 1-3-5 (/16)' },
  { id: 10, name: 'Shiau-Fan',                  category: 'DIFFUSION',  kind: 'ERROR',  param: 9,   description: 'Shiau-Fan 5-tap wide dispersal fan (/16)' },
  { id: 11, name: 'Skip Neighbours',            category: 'DIFFUSION',  kind: 'ERROR',  param: 10,  description: '2-pixel step woven cluster error diffusion' },
  { id: 12, name: 'Skip1 Neighbours',           category: 'DIFFUSION',  kind: 'ERROR',  param: 11,  description: '3-pixel step structured stipple diffusion' },
  { id: 13, name: 'Skip2 Neighbours',           category: 'DIFFUSION',  kind: 'ERROR',  param: 12,  description: '4-pixel step cross-weave diffusion' },
  { id: 14, name: 'Xerox Grain',                category: 'DIFFUSION',  kind: 'ERROR',  param: 13,  isSerpentineDefault: true, description: 'Photocopy toner edge boost + grainy serpentine diffusion' },

  // 7 Ordered & Stochastic algorithms
  { id: 15, name: 'Bayer 2x2',                  category: 'ORDERED',    kind: 'BAYER',  param: 2,   description: 'Ordered dither, 2x2 Bayer threshold matrix' },
  { id: 16, name: 'Bayer 4x4',                  category: 'ORDERED',    kind: 'BAYER',  param: 4,   description: 'Ordered dither, 4x4 Bayer threshold matrix' },
  { id: 17, name: 'Bayer 8x8',                  category: 'ORDERED',    kind: 'BAYER',  param: 8,   description: 'Ordered dither, 8x8 Bayer threshold matrix' },
  { id: 18, name: 'Bayer 16x16',                category: 'ORDERED',    kind: 'BAYER',  param: 16,  description: 'Ordered dither, 16x16 Bayer threshold matrix' },
  { id: 19, name: 'Blue Noise',                 category: 'ORDERED',    kind: 'BLUE',   param: 0,   description: 'Isotropic high-frequency blue-noise field' },
  { id: 20, name: 'Interleaved Gradient Noise', category: 'ORDERED',    kind: 'IGN',    param: 0,   description: 'Jimenez spiral interleaved gradient noise (IGN)' },
  { id: 21, name: 'White Noise',                category: 'ORDERED',    kind: 'WHITE',  param: 0,   description: 'Pure stochastic hash threshold per dither cell' },

  // 27 Continuous Halftone & Pattern Screens
  { id: 22, name: 'Halftone',                   category: 'HALFTONE',   kind: 'SCREEN', param: 0, cell: 8,  angle: 0,    description: 'Round-dot halftone screen, 0°' },
  { id: 23, name: 'Halftone 22.5',              category: 'HALFTONE',   kind: 'SCREEN', param: 0, cell: 8,  angle: 22.5, description: 'Round-dot halftone screen, 22.5°' },
  { id: 24, name: 'Halftone 45',                category: 'HALFTONE',   kind: 'SCREEN', param: 0, cell: 8,  angle: 45,   description: 'Round-dot classic newspaper halftone, 45°' },
  { id: 25, name: 'Matrix',                     category: 'HALFTONE',   kind: 'SCREEN', param: 0, cell: 4,  angle: 45,   description: 'Fine LED / CRT dot matrix screen, 45°' },
  { id: 26, name: 'Square Halftone',            category: 'HALFTONE',   kind: 'SCREEN', param: 1, cell: 8,  angle: 0,    description: 'Crisp expanding geometric square-dot screen' },
  { id: 27, name: 'Mosaic Halftone',            category: 'HALFTONE',   kind: 'SCREEN', param: 2, cell: 6,  angle: 0,    description: 'Beveled cushion mosaic tile screen' },
  { id: 28, name: 'Rekt Block',                 category: 'PATTERN',    kind: 'SCREEN', param: 3, cell: 8,  angle: 0,    description: 'Staggered 2:1 rectangular brick screen' },
  { id: 29, name: 'Row Modulation',             category: 'MODULATION', kind: 'SCREEN', param: 4, cell: 4,  angle: 0,    description: 'Fine horizontal scanline PWM screen' },
  { id: 30, name: 'Medium Modulation',          category: 'MODULATION', kind: 'SCREEN', param: 5, cell: 6,  angle: 0,    description: 'Notched CRT slot-mask horizontal modulation' },
  { id: 31, name: 'Heavy Modulation',           category: 'MODULATION', kind: 'SCREEN', param: 6, cell: 9,  angle: 0,    description: 'Bold serrated horizontal bar screen' },
  { id: 32, name: 'Column Modulation',          category: 'MODULATION', kind: 'SCREEN', param: 7, cell: 5,  angle: 0,    description: 'Vertical aperture-grille bar modulation' },
  { id: 33, name: 'Tilt Modulation',            category: 'MODULATION', kind: 'SCREEN', param: 8, cell: 6,  angle: 0,    description: '+45° engraving diagonal line screen' },
  { id: 34, name: 'Bitslash',                   category: 'MODULATION', kind: 'SCREEN', param: 9, cell: 5,  angle: 0,    description: '-45° stepped bit-slash screen' },
  { id: 35, name: 'Variable Hatch',             category: 'PATTERN',    kind: 'SCREEN', param: 10, cell: 8, angle: 0,    description: 'Woodcut cross-hatching (single to double hatch)' },
  { id: 36, name: 'Grid Modulation',            category: 'MODULATION', kind: 'SCREEN', param: 11, cell: 7, angle: 0,    description: 'Expanding orthogonal wireframe mesh screen' },
  { id: 37, name: 'Cyber',                      category: 'PATTERN',    kind: 'SCREEN', param: 12, cell: 8, angle: 0,    description: 'Octagonal tech-cell matrix with corner nodes' },
  { id: 38, name: 'Cross Square',               category: 'PATTERN',    kind: 'SCREEN', param: 13, cell: 7, angle: 0,    description: 'Expanding plus-cross clusters' },
  { id: 39, name: 'Diamond',                    category: 'PATTERN',    kind: 'SCREEN', param: 14, cell: 8, angle: 0,    description: 'Manhattan-distance diamond clusters' },
  { id: 40, name: 'Star',                       category: 'PATTERN',    kind: 'SCREEN', param: 15, cell: 9, angle: 0,    description: 'Concave 4-pointed astroid star clusters' },
  { id: 41, name: 'Bytewav',                    category: 'MODULATION', kind: 'SCREEN', param: 16, cell: 8, angle: 0,    description: 'FM sine-wave line modulation' },
  { id: 42, name: 'Z-Modulation',               category: 'MODULATION', kind: 'SCREEN', param: 17, cell: 8, angle: 0,    description: 'Chevron herringbone zig-zag screen' },
  { id: 43, name: 'Circuit Modulation',         category: 'MODULATION', kind: 'SCREEN', param: 18, cell: 10, angle: 0,   description: 'PCB concentric tracks and solder pads' },
  { id: 44, name: 'Vertical Stitch',            category: 'OTHER',      kind: 'SCREEN', param: 19, cell: 6, angle: 0,    description: 'Staggered vertical embroidery stitch' },
  { id: 45, name: 'Horizontal Stitch',          category: 'OTHER',      kind: 'SCREEN', param: 20, cell: 6, angle: 0,    description: 'Staggered horizontal running stitch' },
  { id: 46, name: 'Clock',                      category: 'OTHER',      kind: 'SCREEN', param: 21, cell: 10, angle: 0,   description: 'Radial pinwheel sector sweep' },
  { id: 47, name: 'Bi-thread',                  category: 'OTHER',      kind: 'SCREEN', param: 22, cell: 7, angle: 0,    description: 'Over-under twill basketweave' },
  { id: 48, name: 'Knit',                       category: 'OTHER',      kind: 'SCREEN', param: 23, cell: 7, angle: 0,    description: 'V-shaped jersey knit stitch loops' },
];

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hashU32(x: number): number {
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

function hash3(a: number, b: number, c: number): number {
  const p1 = Math.imul(a >>> 0, 0x9e3779b1);
  const p2 = Math.imul((b >>> 0) + (Math.imul(c >>> 0, 0xc2b2ae35) ^ 0x85ebca6b), 1);
  return hashU32(p1 ^ hashU32(p2));
}

function u01(h: number): number {
  return (h >>> 8) * (1.0 / 16777216.0);
}

function luma709(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function bayerThreshold(x: number, y: number, n: number): number {
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

export function blueNoiseThreshold(x: number, y: number, seed: number): number {
  const ux = ((x % 64) + 64) % 64;
  const uy = ((y % 64) + 64) % 64;

  const cellR2 = (cx: number, cy: number): number => {
    cx = (cx + 64) & 63;
    cy = (cy + 64) & 63;
    const q = cx * 0.7548776662466927 + cy * 0.5698402909980532;
    const r2 = q - Math.floor(q);
    const h = u01(hash3(cx, cy, (seed ^ 0xb10e64) >>> 0));
    return 0.65 * r2 + 0.35 * h;
  };

  const c0 = cellR2(ux, uy);
  let neigh = 0;
  neigh += cellR2(ux - 1, uy) + cellR2(ux + 1, uy) + cellR2(ux, uy - 1) + cellR2(ux, uy + 1);
  neigh += 0.707 * (cellR2(ux - 1, uy - 1) + cellR2(ux + 1, uy - 1) + cellR2(ux - 1, uy + 1) + cellR2(ux + 1, uy + 1));
  neigh /= 6.828;

  const hp = (c0 - neigh) * 2.65;
  const cdf = 0.5 + 0.5 * Math.tanh(hp * 1.15);
  let u = c0 + 0.5 * (c0 - neigh);
  u -= Math.floor(u);
  return clamp(0.55 * cdf + 0.45 * u, 0.001, 0.999);
}

function spot(id: number, fu: number, fv: number, pu: number, pv: number): number {
  const par = (pu + pv) & 1;
  const du = fu - 0.5;
  const dv = fv - 0.5;
  const tri = (t: number) => {
    t -= Math.floor(t);
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

    case 9: { // S_DIAG2
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
    case 16: { // S_WAVE
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
    default:
      return 0.5;
  }
}

const SCREEN_MAP_CACHE = new Map<number, Float32Array>();

function getScreenMap(spotId: number): Float32Array {
  if (SCREEN_MAP_CACHE.has(spotId)) {
    return SCREEN_MAP_CACHE.get(spotId)!;
  }
  const M = 64;
  const raw = new Float32Array(M * M);
  const order = new Int32Array(M * M);

  for (let y = 0; y < M; ++y) {
    for (let x = 0; x < M; ++x) {
      const u2 = (x + 0.5) * (2.0 / M);
      const v2 = (y + 0.5) * (2.0 / M);
      let pu = Math.floor(u2); if (pu > 1) pu = 1;
      let pv = Math.floor(v2); if (pv > 1) pv = 1;
      const fu = u2 - pu;
      const fv = v2 - pv;
      const tie = (u01(hash3(x, y, 0x5c8ee4)) - 0.5) * 1e-4;
      raw[y * M + x] = spot(spotId, fu, fv, pu, pv) + tie;
      order[y * M + x] = y * M + x;
    }
  }

  const orderArr = Array.from(order);
  orderArr.sort((a, b) => raw[a] - raw[b]);

  const sm = new Float32Array(M * M);
  const invN = 1.0 / (M * M);
  for (let r = 0; r < M * M; ++r) {
    sm[orderArr[r]] = 1.0 - (r + 0.5) * invN;
  }

  SCREEN_MAP_CACHE.set(spotId, sm);
  return sm;
}

function sampleScreen(sm: Float32Array, u2: number, v2: number): number {
  let tu = u2 * 0.5; tu -= Math.floor(tu);
  let tv = v2 * 0.5; tv -= Math.floor(tv);
  const fx = clamp(tu * 64.0 - 0.5, 0.0, 63.999);
  const fy = clamp(tv * 64.0 - 0.5, 0.0, 63.999);
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

  const top = lerp(a, b, dx);
  const bot = lerp(c, d, dx);
  return lerp(top, bot, dy);
}

interface Tap { dx: number; dy: number; w: number; }
interface Kernel { ntaps: number; taps: Tap[]; }

const ERROR_KERNELS: Kernel[] = [
  // 0: Floyd-Steinberg
  { ntaps: 4, taps: [{ dx: 1, dy: 0, w: 7 / 16 }, { dx: -1, dy: 1, w: 3 / 16 }, { dx: 0, dy: 1, w: 5 / 16 }, { dx: 1, dy: 1, w: 1 / 16 }] },
  // 1: Jarvis-Judice-Ninke / 48
  { ntaps: 12, taps: [
    { dx: 1, dy: 0, w: 7 / 48 }, { dx: 2, dy: 0, w: 5 / 48 },
    { dx: -2, dy: 1, w: 3 / 48 }, { dx: -1, dy: 1, w: 5 / 48 }, { dx: 0, dy: 1, w: 7 / 48 }, { dx: 1, dy: 1, w: 5 / 48 }, { dx: 2, dy: 1, w: 3 / 48 },
    { dx: -2, dy: 2, w: 1 / 48 }, { dx: -1, dy: 2, w: 3 / 48 }, { dx: 0, dy: 2, w: 5 / 48 }, { dx: 1, dy: 2, w: 3 / 48 }, { dx: 2, dy: 2, w: 1 / 48 }
  ]},
  // 2: Stucki / 42
  { ntaps: 12, taps: [
    { dx: 1, dy: 0, w: 8 / 42 }, { dx: 2, dy: 0, w: 4 / 42 },
    { dx: -2, dy: 1, w: 2 / 42 }, { dx: -1, dy: 1, w: 4 / 42 }, { dx: 0, dy: 1, w: 8 / 42 }, { dx: 1, dy: 1, w: 4 / 42 }, { dx: 2, dy: 1, w: 2 / 42 },
    { dx: -2, dy: 2, w: 1 / 42 }, { dx: -1, dy: 2, w: 2 / 42 }, { dx: 0, dy: 2, w: 4 / 42 }, { dx: 1, dy: 2, w: 2 / 42 }, { dx: 2, dy: 2, w: 1 / 42 }
  ]},
  // 3: Atkinson
  { ntaps: 6, taps: [
    { dx: 1, dy: 0, w: 1 / 8 }, { dx: 2, dy: 0, w: 1 / 8 },
    { dx: -1, dy: 1, w: 1 / 8 }, { dx: 0, dy: 1, w: 1 / 8 }, { dx: 1, dy: 1, w: 1 / 8 },
    { dx: 0, dy: 2, w: 1 / 8 }
  ]},
  // 4: Burkes / 32
  { ntaps: 7, taps: [
    { dx: 1, dy: 0, w: 8 / 32 }, { dx: 2, dy: 0, w: 4 / 32 },
    { dx: -2, dy: 1, w: 2 / 32 }, { dx: -1, dy: 1, w: 4 / 32 }, { dx: 0, dy: 1, w: 8 / 32 }, { dx: 1, dy: 1, w: 4 / 32 }, { dx: 2, dy: 1, w: 2 / 32 }
  ]},
  // 5: Sierra-3 / 32
  { ntaps: 10, taps: [
    { dx: 1, dy: 0, w: 5 / 32 }, { dx: 2, dy: 0, w: 3 / 32 },
    { dx: -2, dy: 1, w: 2 / 32 }, { dx: -1, dy: 1, w: 4 / 32 }, { dx: 0, dy: 1, w: 5 / 32 }, { dx: 1, dy: 1, w: 4 / 32 }, { dx: 2, dy: 1, w: 2 / 32 },
    { dx: -1, dy: 2, w: 2 / 32 }, { dx: 0, dy: 2, w: 3 / 32 }, { dx: 1, dy: 2, w: 2 / 32 }
  ]},
  // 6: Sierra Two-Row / 16
  { ntaps: 7, taps: [
    { dx: 1, dy: 0, w: 4 / 16 }, { dx: 2, dy: 0, w: 3 / 16 },
    { dx: -2, dy: 1, w: 1 / 16 }, { dx: -1, dy: 1, w: 2 / 16 }, { dx: 0, dy: 1, w: 3 / 16 }, { dx: 1, dy: 1, w: 2 / 16 }, { dx: 2, dy: 1, w: 1 / 16 }
  ]},
  // 7: Sierra Lite / 4
  { ntaps: 3, taps: [{ dx: 1, dy: 0, w: 2 / 4 }, { dx: -1, dy: 1, w: 1 / 4 }, { dx: 0, dy: 1, w: 1 / 4 }] },
  // 8: Fan / 16
  { ntaps: 4, taps: [{ dx: 1, dy: 0, w: 7 / 16 }, { dx: -2, dy: 1, w: 1 / 16 }, { dx: -1, dy: 1, w: 3 / 16 }, { dx: 0, dy: 1, w: 5 / 16 }] },
  // 9: Shiau-Fan / 16
  { ntaps: 5, taps: [{ dx: 1, dy: 0, w: 8 / 16 }, { dx: -3, dy: 1, w: 1 / 16 }, { dx: -2, dy: 1, w: 1 / 16 }, { dx: -1, dy: 1, w: 2 / 16 }, { dx: 0, dy: 1, w: 4 / 16 }] },
  // 10: Skip Neighbours
  { ntaps: 4, taps: [{ dx: 2, dy: 0, w: 7 / 16 }, { dx: -2, dy: 2, w: 3 / 16 }, { dx: 0, dy: 2, w: 5 / 16 }, { dx: 2, dy: 2, w: 1 / 16 }] },
  // 11: Skip1 Neighbours
  { ntaps: 5, taps: [{ dx: 3, dy: 0, w: 6 / 16 }, { dx: -3, dy: 2, w: 3 / 16 }, { dx: 0, dy: 3, w: 4 / 16 }, { dx: 3, dy: 2, w: 2 / 16 }, { dx: 0, dy: 1, w: 1 / 16 }] },
  // 12: Skip2 Neighbours
  { ntaps: 5, taps: [{ dx: 4, dy: 0, w: 6 / 16 }, { dx: -4, dy: 3, w: 3 / 16 }, { dx: 0, dy: 4, w: 4 / 16 }, { dx: 4, dy: 3, w: 2 / 16 }, { dx: 2, dy: 1, w: 1 / 16 }] },
  // 13: Xerox Grain
  { ntaps: 4, taps: [{ dx: 1, dy: 0, w: 7 / 16 }, { dx: -1, dy: 1, w: 3 / 16 }, { dx: 0, dy: 1, w: 5 / 16 }, { dx: 1, dy: 1, w: 1 / 16 }] }
];

export function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16) || 0;
  return [((num >> 16) & 255) / 255.0, ((num >> 8) & 255) / 255.0, (num & 255) / 255.0];
}

// ---------------------------------------------------------------------------
// PREPROCESS: Contrast, Brightness
// ---------------------------------------------------------------------------
export function preprocessImage(
  srcData: ImageData,
  params: DitherParams
): Float32Array {
  const { width: W, height: H, data } = srcData;
  const buf = new Float32Array(W * H * 4);
  const contrast = params.contrast / 100.0;
  const bright = params.brightness / 100.0;

  for (let i = 0; i < W * H; ++i) {
    const si = i * 4;
    let r = data[si] / 255.0;
    let g = data[si + 1] / 255.0;
    let b = data[si + 2] / 255.0;
    const a = data[si + 3] / 255.0;

    r = clamp((r - 0.5) * contrast + 0.5 + bright, 0.0, 1.0);
    g = clamp((g - 0.5) * contrast + 0.5 + bright, 0.0, 1.0);
    b = clamp((b - 0.5) * contrast + 0.5 + bright, 0.0, 1.0);

    buf[si] = r;
    buf[si + 1] = g;
    buf[si + 2] = b;
    buf[si + 3] = a;
  }

  return buf;
}

// ---------------------------------------------------------------------------
// MAIN RENDER ENGINE WITH TRUE DOT DENSITY GATING (AMOUNT, WHITE, BLACK)
// ---------------------------------------------------------------------------
export function renderDitherEngine(
  srcData: ImageData,
  params: DitherParams
): ImageData {
  const W = srcData.width;
  const H = srcData.height;
  const algo = ALGORITHMS[Math.min(ALGORITHMS.length - 1, Math.max(0, params.algoId))];
  const outData = new ImageData(W, H);
  const out = outData.data;

  // 1. Run Preprocessing
  const srcBuf = preprocessImage(srcData, params);

  // Common parameters
  const ditherScale = Math.max(1.0, params.scale);
  const bias = ((50.0 - clamp(params.threshold, 0, 100)) / 50.0) * 0.45;
  const spread = clamp(params.spread / 100.0, 0.0, 2.5);
  const seed = (params.seed ^ 0xd17e5) >>> 0;

  // Density Coverage Parameters (NOT mere opacity!)
  const masterDensity = clamp(params.amount / 100.0, 0.0, 1.0);
  const whiteDensity = clamp(params.whiteAmount / 100.0, 0.0, 1.0);
  const blackDensity = clamp(params.blackAmount / 100.0, 0.0, 1.0);

  const nch = params.mode === 'rgb' ? 3 : 1;

  // -------------------------------------------------------------------------
  // CONTINUOUS SCREEN & ORDERED EVALUATION
  // -------------------------------------------------------------------------
  if (
    algo.kind === 'SCREEN' || 
    algo.kind === 'BAYER' || 
    algo.kind === 'BLUE' || 
    algo.kind === 'IGN' || 
    algo.kind === 'WHITE'
  ) {
    let sm: Float32Array | null = null;
    let pitch = 6.0;
    if (algo.kind === 'SCREEN') {
      sm = getScreenMap(algo.param);
      pitch = Math.max(1.0, (algo.cell || 8) * ditherScale * Math.max(10, params.patternScale) / 100.0);
    }
    const bayN = Math.max(2, algo.param);
    const nz = params.noise / 100.0;

    const cosCh = new Float32Array(nch);
    const sinCh = new Float32Array(nch);
    for (let k = 0; k < nch; ++k) {
      const angDeg = (algo.angle || 0) + params.patternAngle;
      const rad = angDeg * (Math.PI / 180.0);
      cosCh[k] = Math.cos(rad);
      sinCh[k] = Math.sin(rad);
    }

    for (let y = 0; y < H; ++y) {
      const rowOffset = y * W;
      for (let x = 0; x < W; ++x) {
        const si = (rowOffset + x) * 4;
        const sR = srcBuf[si];
        const sG = srcBuf[si + 1];
        const sB = srcBuf[si + 2];
        const sA = srcBuf[si + 3];

        let chVal0 = 0, chVal1 = 0, chVal2 = 0;
        if (nch === 1) {
          chVal0 = luma709(sR, sG, sB);
        } else {
          chVal0 = sR; chVal1 = sG; chVal2 = sB;
        }

        const outCh = [0, 0, 0];
        const inCh = [chVal0, chVal1, chVal2];

        for (let k = 0; k < nch; ++k) {
          let T = 0.5;
          const chSeed = (seed + k * 0x9e37) >>> 0;
          switch (algo.kind) {
            case 'BAYER': {
              const bx = Math.floor(x / ditherScale);
              const by = Math.floor(y / ditherScale);
              T = bayerThreshold(bx, by, bayN);
              break;
            }
            case 'BLUE': {
              const bx = Math.floor(x / ditherScale) + k * 17;
              const by = Math.floor(y / ditherScale) + k * 29;
              T = blueNoiseThreshold(bx, by, chSeed);
              break;
            }
            case 'IGN': {
              let f = 0.06711056 * ((x / ditherScale) + k * 11) + 0.00583715 * ((y / ditherScale) + k * 19);
              f -= Math.floor(f);
              f *= 52.9829189;
              T = f - Math.floor(f);
              break;
            }
            case 'WHITE': {
              const bx = Math.floor(x / ditherScale);
              const by = Math.floor(y / ditherScale);
              T = u01(hash3(bx, by, chSeed));
              break;
            }
            case 'SCREEN': {
              if (sm) {
                const xs = x + 0.5;
                const ys = y + 0.5;
                const u2 = (xs * cosCh[k] + ys * sinCh[k]) / pitch;
                const v2 = (-xs * sinCh[k] + ys * cosCh[k]) / pitch;
                T = sampleScreen(sm, u2, v2);
              }
              break;
            }
          }

          if (nz > 0) {
            T = clamp(T + (u01(hash3(x, y, (chSeed ^ 0x5a5a) >>> 0)) - 0.5) * nz, 0.0, 1.0);
          }
          T = clamp(0.5 + (T - 0.5) * spread, 0.001, 0.999);

          const val = clamp(inCh[k] + bias, 0.0, 1.0);
          outCh[k] = val >= T ? 1.0 : 0.0;
        }

        let ditherR = 0, ditherG = 0, ditherB = 0;
        if (params.mode === 'rgb') {
          ditherR = outCh[0]; ditherG = outCh[1]; ditherB = outCh[2];
        } else {
          ditherR = ditherG = ditherB = outCh[0];
        }

        // True Dot Density Gating:
        // Controls actual presence/count of dither dots, blending with original image naturally!
        let dotProb = masterDensity;
        let gateSeed = 0x51a7;

        if (params.mode === 'monochrome') {
          if (outCh[0] >= 0.5) {
            // White dot candidate: density modulated by White Amount
            dotProb = masterDensity * whiteDensity;
            gateSeed = 0x93e1;
          } else {
            // Black dot candidate: density modulated by Black Amount
            dotProb = masterDensity * blackDensity;
            gateSeed = 0x48d2;
          }
        }

        const gate = u01(hash3(x, y, (seed ^ gateSeed) >>> 0));
        if (gate < dotProb) {
          // Commit solid dither dot
          out[si] = Math.round(ditherR * 255);
          out[si + 1] = Math.round(ditherG * 255);
          out[si + 2] = Math.round(ditherB * 255);
        } else {
          // Preserved source image pixel underneath
          out[si] = Math.round(sR * 255);
          out[si + 1] = Math.round(sG * 255);
          out[si + 2] = Math.round(sB * 255);
        }
        out[si + 3] = Math.round(sA * 255);
      }
    }
    return outData;
  }

  // -------------------------------------------------------------------------
  // ERROR DIFFUSION PIPELINE (15 kernels)
  // -------------------------------------------------------------------------
  const block = (params.pixelate && ditherScale > 1.0) ? Math.max(1, Math.floor(ditherScale + 0.5)) : 1;
  const gw = Math.max(1, Math.floor((W + block - 1) / block));
  const gh = Math.max(1, Math.floor((H + block - 1) / block));

  const pl: Float32Array[] = [];
  for (let c = 0; c < nch; ++c) {
    pl.push(new Float32Array(gw * gh));
  }

  for (let gy = 0; gy < gh; ++gy) {
    for (let gx = 0; gx < gw; ++gx) {
      let r = 0, g = 0, b = 0;
      if (block <= 1) {
        const si = (gy * W + gx) * 4;
        r = srcBuf[si]; g = srcBuf[si + 1]; b = srcBuf[si + 2];
      } else {
        let accR = 0, accG = 0, accB = 0, cnt = 0;
        const xStart = gx * block;
        const yStart = gy * block;
        const xe = Math.min(W, xStart + block);
        const ye = Math.min(H, yStart + block);
        for (let y = yStart; y < ye; ++y) {
          for (let x = xStart; x < xe; ++x) {
            const si = (y * W + x) * 4;
            accR += srcBuf[si]; accG += srcBuf[si + 1]; accB += srcBuf[si + 2];
            cnt++;
          }
        }
        const invCnt = cnt > 0 ? 1.0 / cnt : 0;
        r = accR * invCnt; g = accG * invCnt; b = accB * invCnt;
      }

      const gi = gy * gw + gx;
      if (nch === 1) {
        pl[0][gi] = luma709(r, g, b);
      } else {
        pl[0][gi] = r; pl[1][gi] = g; pl[2][gi] = b;
      }
    }
  }

  const kid = algo.param;
  const K = ERROR_KERNELS[Math.min(ERROR_KERNELS.length - 1, Math.max(0, kid))];
  const serp = params.serpentine || (algo.isSerpentineDefault ?? false);
  const isXerox = algo.id === 14;

  for (let k = 0; k < nch; ++k) {
    const plane = pl[k];

    if (isXerox && gw > 2 && gh > 2) {
      const orig = new Float32Array(plane);
      for (let y = 1; y < gh - 1; ++y) {
        for (let x = 1; x < gw - 1; ++x) {
          const c = orig[y * gw + x];
          const lap = 4 * c - orig[(y - 1) * gw + x] - orig[(y + 1) * gw + x] - orig[y * gw + (x - 1)] - orig[y * gw + (x + 1)];
          const toner = (u01(hash3(x, y, (seed ^ 0x7e80) >>> 0)) - 0.5) * 0.15;
          plane[y * gw + x] = clamp(c + lap * 0.55 + toner, 0.0, 1.0);
        }
      }
    }

    const planeSeed = (seed + k * 193) >>> 0;
    const nz = (params.noise / 100.0) + (isXerox ? 0.35 : 0.0);

    for (let y = 0; y < gh; ++y) {
      const rev = serp && (y & 1) === 1;
      for (let i = 0; i < gw; ++i) {
        const x = rev ? gw - 1 - i : i;
        const gi = y * gw + x;
        let v = clamp(plane[gi], -0.35, 1.35);

        let t = v;
        if (nz > 0) {
          t += (u01(hash3(x, y, planeSeed)) - 0.5) * nz;
        }

        const q = (t + bias) >= 0.5 ? 1.0 : 0.0;
        const err = clamp((v - q) * spread, -1.0, 1.0);
        plane[gi] = q;

        for (let ti = 0; ti < K.ntaps; ++ti) {
          const tp = K.taps[ti];
          const nx = x + (rev ? -tp.dx : tp.dx);
          const ny = y + tp.dy;
          if (nx >= 0 && nx < gw && ny >= 0 && ny < gh) {
            plane[ny * gw + nx] += err * tp.w;
          }
        }
      }
    }
  }

  for (let y = 0; y < H; ++y) {
    const gy = Math.min(gh - 1, Math.floor(y / block));
    for (let x = 0; x < W; ++x) {
      const gx = Math.min(gw - 1, Math.floor(x / block));
      const gi = gy * gw + gx;
      const si = (y * W + x) * 4;

      let ditherR = 0, ditherG = 0, ditherB = 0;
      if (params.mode === 'rgb') {
        ditherR = clamp(pl[0][gi], 0.0, 1.0);
        ditherG = clamp(pl[1][gi], 0.0, 1.0);
        ditherB = clamp(pl[2][gi], 0.0, 1.0);
      } else {
        const v = clamp(pl[0][gi], 0.0, 1.0);
        ditherR = ditherG = ditherB = v;
      }

      // Density Gating
      let dotProb = masterDensity;
      let gateSeed = 0x51a7;
      if (params.mode === 'monochrome') {
        if (ditherR >= 0.5) {
          dotProb = masterDensity * whiteDensity;
          gateSeed = 0x93e1;
        } else {
          dotProb = masterDensity * blackDensity;
          gateSeed = 0x48d2;
        }
      }

      const gate = u01(hash3(x, y, (seed ^ gateSeed) >>> 0));
      if (gate < dotProb) {
        out[si] = Math.round(ditherR * 255);
        out[si + 1] = Math.round(ditherG * 255);
        out[si + 2] = Math.round(ditherB * 255);
      } else {
        out[si] = Math.round(srcBuf[si] * 255);
        out[si + 1] = Math.round(srcBuf[si + 1] * 255);
        out[si + 2] = Math.round(srcBuf[si + 2] * 255);
      }
      out[si + 3] = Math.round(srcBuf[si + 3] * 255);
    }
  }

  return outData;
}
