import { DitherAlgoDefinition, DitherSettings } from '../types/dither';

// ----------------------------------------------------------------------------
// Algorithm Registry matching core/dither.cpp ALGOS[]
// ----------------------------------------------------------------------------
export const DITHER_ALGOS: DitherAlgoDefinition[] = [
  { id: 0,  name: 'Floyd-Steinberg',            category: 'diffusion', kind: 'error',  param: 0,   cell: 0, angle: 0,    description: 'Classic error diffusion 7-3-5-1 /16' },
  { id: 1,  name: 'Floyd-Steinberg Serpentine', category: 'diffusion', kind: 'error',  param: 256, cell: 0, angle: 0,    description: 'Alternating bidirectional scan diffusion' },
  { id: 2,  name: 'Jarvis-Judice-Ninke',        category: 'diffusion', kind: 'error',  param: 1,   cell: 0, angle: 0,    description: '3-row 12-tap wide diffusion kernel /48' },
  { id: 3,  name: 'Stucki',                     category: 'diffusion', kind: 'error',  param: 2,   cell: 0, angle: 0,    description: '3-row 12-tap sharp crisp kernel /42' },
  { id: 4,  name: 'Atkinson',                   category: 'diffusion', kind: 'error',  param: 3,   cell: 0, angle: 0,    description: 'Diffuses 6/8 of error for crisp high-contrast dotting' },
  { id: 5,  name: 'Burkes',                     category: 'diffusion', kind: 'error',  param: 4,   cell: 0, angle: 0,    description: '2-row 7-tap fast diffusion /32' },
  { id: 6,  name: 'Sierra',                     category: 'diffusion', kind: 'error',  param: 5,   cell: 0, angle: 0,    description: 'Sierra-3, 3-row 10-tap kernel /32' },
  { id: 7,  name: 'Sierra Two Row',             category: 'diffusion', kind: 'error',  param: 6,   cell: 0, angle: 0,    description: 'Sierra-2, 2-row 7-tap kernel /16' },
  { id: 8,  name: 'Sierra Lite',                category: 'diffusion', kind: 'error',  param: 7,   cell: 0, angle: 0,    description: 'Sierra Lite 2-1-1 /4' },
  { id: 9,  name: 'Fan',                        category: 'diffusion', kind: 'error',  param: 8,   cell: 0, angle: 0,    description: 'Fan kernel 7 / 1-3-5 (/16)' },
  { id: 10, name: 'Shiau-Fan',                  category: 'diffusion', kind: 'error',  param: 9,   cell: 0, angle: 0,    description: 'Shiau-Fan wide fan kernel (/16)' },
  { id: 11, name: 'Skip Neighbours',            category: 'diffusion', kind: 'error',  param: 10,  cell: 0, angle: 0,    description: '2-px step woven cluster error diffusion' },
  { id: 12, name: 'Skip1 Neighbours',           category: 'diffusion', kind: 'error',  param: 11,  cell: 0, angle: 0,    description: '3-px step structured stipple diffusion' },
  { id: 13, name: 'Skip2 Neighbours',           category: 'diffusion', kind: 'error',  param: 12,  cell: 0, angle: 0,    description: '4-px step cross-weave diffusion' },
  { id: 14, name: 'Xerox Grain',                category: 'diffusion', kind: 'error',  param: 1792,cell: 0, angle: 0,    description: 'Photocopy toner edge boost + grainy serpentine diffusion' },

  { id: 15, name: 'Bayer 2x2',                  category: 'ordered',   kind: 'bayer',  param: 2,   cell: 0, angle: 0,    description: 'Ordered dither, 2x2 Bayer threshold matrix' },
  { id: 16, name: 'Bayer 4x4',                  category: 'ordered',   kind: 'bayer',  param: 4,   cell: 0, angle: 0,    description: 'Ordered dither, 4x4 Bayer threshold matrix' },
  { id: 17, name: 'Bayer 8x8',                  category: 'ordered',   kind: 'bayer',  param: 8,   cell: 0, angle: 0,    description: 'Ordered dither, 8x8 Bayer threshold matrix' },
  { id: 18, name: 'Bayer 16x16',                category: 'ordered',   kind: 'bayer',  param: 16,  cell: 0, angle: 0,    description: 'Ordered dither, 16x16 Bayer threshold matrix' },
  { id: 19, name: 'Blue Noise',                 category: 'stochastic',kind: 'blue',   param: 0,   cell: 0, angle: 0,    description: 'Isotropic high-frequency blue-noise field' },
  { id: 20, name: 'Interleaved Gradient Noise', category: 'stochastic',kind: 'ign',    param: 0,   cell: 0, angle: 0,    description: 'Jimenez spiral interleaved gradient noise' },
  { id: 21, name: 'White Noise',                category: 'stochastic',kind: 'white',  param: 0,   cell: 0, angle: 0,    description: 'Stochastic random threshold per cell' },

  { id: 22, name: 'Halftone (0°)',              category: 'screens',   kind: 'screen', param: 0,   cell: 8, angle: 0,    description: 'Classic round-dot halftone screen, 0 deg' },
  { id: 23, name: 'Halftone 22.5°',             category: 'screens',   kind: 'screen', param: 0,   cell: 8, angle: 22.5, description: 'Round-dot halftone screen, 22.5 deg' },
  { id: 24, name: 'Halftone 45°',               category: 'screens',   kind: 'screen', param: 0,   cell: 8, angle: 45,   description: 'Round-dot newspaper halftone screen, 45 deg' },
  { id: 25, name: 'Matrix',                     category: 'screens',   kind: 'screen', param: 0,   cell: 4, angle: 45,   description: 'Fine LED / CRT dot matrix, 45 deg' },
  { id: 26, name: 'Square Halftone',            category: 'screens',   kind: 'screen', param: 1,   cell: 8, angle: 0,    description: 'Crisp expanding square-dot screen' },
  { id: 27, name: 'Mosaic Halftone',            category: 'screens',   kind: 'screen', param: 2,   cell: 6, angle: 0,    description: 'Beveled cushion mosaic tile screen' },
  { id: 28, name: 'Rekt Block',                 category: 'screens',   kind: 'screen', param: 3,   cell: 8, angle: 0,    description: 'Staggered 2:1 rectangular brick screen' },
  { id: 29, name: 'Row Modulation',             category: 'screens',   kind: 'screen', param: 4,   cell: 4, angle: 0,    description: 'Fine horizontal scanline PWM screen' },
  { id: 30, name: 'Medium Modulation',          category: 'screens',   kind: 'screen', param: 5,   cell: 6, angle: 0,    description: 'Notched CRT slot-mask horizontal modulation' },
  { id: 31, name: 'Heavy Modulation',           category: 'screens',   kind: 'screen', param: 6,   cell: 9, angle: 0,    description: 'Bold serrated horizontal bar screen' },
  { id: 32, name: 'Column Modulation',          category: 'screens',   kind: 'screen', param: 7,   cell: 5, angle: 0,    description: 'Vertical aperture-grille bar modulation' },
  { id: 33, name: 'Tilt Modulation',            category: 'screens',   kind: 'screen', param: 8,   cell: 6, angle: 0,    description: '+45 deg engraving diagonal line screen' },
  { id: 34, name: 'Bitslash',                   category: 'screens',   kind: 'screen', param: 9,   cell: 5, angle: 0,    description: '-45 deg stepped bit-slash screen' },
  { id: 35, name: 'Variable Hatch',             category: 'screens',   kind: 'screen', param: 10,  cell: 8, angle: 0,    description: 'Woodcut cross-hatching (single to double hatch)' },
  { id: 36, name: 'Grid Modulation',            category: 'screens',   kind: 'screen', param: 11,  cell: 7, angle: 0,    description: 'Expanding orthogonal wireframe mesh screen' },
  { id: 37, name: 'Cyber',                      category: 'screens',   kind: 'screen', param: 12,  cell: 8, angle: 0,    description: 'Octagonal tech-cell matrix with corner nodes' },
  { id: 38, name: 'Cross Square',               category: 'screens',   kind: 'screen', param: 13,  cell: 7, angle: 0,    description: 'Expanding plus-cross clusters' },
  { id: 39, name: 'Diamond',                    category: 'screens',   kind: 'screen', param: 14,  cell: 8, angle: 0,    description: 'Manhattan-distance diamond clusters' },
  { id: 40, name: 'Star',                       category: 'screens',   kind: 'screen', param: 15,  cell: 9, angle: 0,    description: 'Concave 4-pointed astroid star clusters' },
  { id: 41, name: 'Bytewav',                    category: 'screens',   kind: 'screen', param: 16,  cell: 8, angle: 0,    description: 'FM sine-wave line modulation' },
  { id: 42, name: 'Z-Modulation',               category: 'screens',   kind: 'screen', param: 17,  cell: 8, angle: 0,    description: 'Chevron herringbone zig-zag screen' },
  { id: 43, name: 'Circuit Modulation',         category: 'screens',   kind: 'screen', param: 18,  cell: 10,angle: 0,    description: 'PCB concentric tracks and solder pads' },
  { id: 44, name: 'Vertical Stitch',            category: 'screens',   kind: 'screen', param: 19,  cell: 6, angle: 0,    description: 'Staggered vertical embroidery stitch' },
  { id: 45, name: 'Horizontal Stitch',          category: 'screens',   kind: 'screen', param: 20,  cell: 6, angle: 0,    description: 'Staggered horizontal running stitch' },
  { id: 46, name: 'Clock',                      category: 'screens',   kind: 'screen', param: 21,  cell: 10,angle: 0,    description: 'Radial pinwheel sector sweep' },
  { id: 47, name: 'Bi-thread',                  category: 'screens',   kind: 'screen', param: 22,  cell: 7, angle: 0,    description: 'Over-under twill basketweave' },
  { id: 48, name: 'Knit',                       category: 'screens',   kind: 'screen', param: 23,  cell: 7, angle: 0,    description: 'V-shaped jersey knit stitch loops' },
];

// Hash utilities
function hash_u32(x: number): number {
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

function hash3(a: number, b: number, c: number): number {
  const h1 = Math.imul(a >>> 0, 0x9E3779B1) >>> 0;
  const h2 = Math.imul(b ^ 0x85ebca6b, 1) >>> 0;
  const h3 = (c + 0xc2b2ae35) >>> 0;
  return hash_u32(h1 ^ hash_u32(h2 ^ hash_u32(h3)));
}

function u01(h: number): number {
  return ((h >>> 8) & 0xffffff) * (1.0 / 16777216.0);
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

// Parse hex to [r, g, b] in [0, 1]
export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const num = parseInt(c, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

// Error diffusion kernels
interface Tap { dx: number; dy: number; w: number; }
interface Kernel { ntaps: number; taps: Tap[]; }

const KERNELS: Kernel[] = [
  // 0: Floyd-Steinberg / 16
  { ntaps: 4, taps: [{dx:1, dy:0, w:7/16}, {dx:-1, dy:1, w:3/16}, {dx:0, dy:1, w:5/16}, {dx:1, dy:1, w:1/16}] },
  // 1: Jarvis-Judice-Ninke / 48
  { ntaps: 12, taps: [
    {dx:1, dy:0, w:7/48}, {dx:2, dy:0, w:5/48},
    {dx:-2, dy:1, w:3/48}, {dx:-1, dy:1, w:5/48}, {dx:0, dy:1, w:7/48}, {dx:1, dy:1, w:5/48}, {dx:2, dy:1, w:3/48},
    {dx:-2, dy:2, w:1/48}, {dx:-1, dy:2, w:3/48}, {dx:0, dy:2, w:5/48}, {dx:1, dy:2, w:3/48}, {dx:2, dy:2, w:1/48}
  ] },
  // 2: Stucki / 42
  { ntaps: 12, taps: [
    {dx:1, dy:0, w:8/42}, {dx:2, dy:0, w:4/42},
    {dx:-2, dy:1, w:2/42}, {dx:-1, dy:1, w:4/42}, {dx:0, dy:1, w:8/42}, {dx:1, dy:1, w:4/42}, {dx:2, dy:1, w:2/42},
    {dx:-2, dy:2, w:1/42}, {dx:-1, dy:2, w:2/42}, {dx:0, dy:2, w:4/42}, {dx:1, dy:2, w:2/42}, {dx:2, dy:2, w:1/42}
  ] },
  // 3: Atkinson / 8 (high-contrast crispness)
  { ntaps: 6, taps: [{dx:1, dy:0, w:1/8}, {dx:2, dy:0, w:1/8}, {dx:-1, dy:1, w:1/8}, {dx:0, dy:1, w:1/8}, {dx:1, dy:1, w:1/8}, {dx:0, dy:2, w:1/8}] },
  // 4: Burkes / 32
  { ntaps: 7, taps: [
    {dx:1, dy:0, w:8/32}, {dx:2, dy:0, w:4/32},
    {dx:-2, dy:1, w:2/32}, {dx:-1, dy:1, w:4/32}, {dx:0, dy:1, w:8/32}, {dx:1, dy:1, w:4/32}, {dx:2, dy:1, w:2/32}
  ] },
  // 5: Sierra-3 / 32
  { ntaps: 10, taps: [
    {dx:1, dy:0, w:5/32}, {dx:2, dy:0, w:3/32},
    {dx:-2, dy:1, w:2/32}, {dx:-1, dy:1, w:4/32}, {dx:0, dy:1, w:5/32}, {dx:1, dy:1, w:4/32}, {dx:2, dy:1, w:2/32},
    {dx:-1, dy:2, w:2/32}, {dx:0, dy:2, w:3/32}, {dx:1, dy:2, w:2/32}
  ] },
  // 6: Sierra-2 / 16
  { ntaps: 7, taps: [
    {dx:1, dy:0, w:4/16}, {dx:2, dy:0, w:3/16},
    {dx:-2, dy:1, w:1/16}, {dx:-1, dy:1, w:2/16}, {dx:0, dy:1, w:3/16}, {dx:1, dy:1, w:2/16}, {dx:2, dy:1, w:1/16}
  ] },
  // 7: Sierra Lite / 4
  { ntaps: 3, taps: [{dx:1, dy:0, w:2/4}, {dx:-1, dy:1, w:1/4}, {dx:0, dy:1, w:1/4}] },
  // 8: Fan / 16
  { ntaps: 4, taps: [{dx:1, dy:0, w:7/16}, {dx:-2, dy:1, w:1/16}, {dx:-1, dy:1, w:3/16}, {dx:0, dy:1, w:5/16}] },
  // 9: Shiau-Fan / 16
  { ntaps: 5, taps: [{dx:1, dy:0, w:8/16}, {dx:-3, dy:1, w:1/16}, {dx:-2, dy:1, w:1/16}, {dx:-1, dy:1, w:2/16}, {dx:0, dy:1, w:4/16}] },
  // 10: Skip Neighbours
  { ntaps: 4, taps: [{dx:2, dy:0, w:7/16}, {dx:-2, dy:2, w:3/16}, {dx:0, dy:2, w:5/16}, {dx:2, dy:2, w:1/16}] },
  // 11: Skip1 Neighbours
  { ntaps: 5, taps: [{dx:3, dy:0, w:6/16}, {dx:-3, dy:2, w:3/16}, {dx:0, dy:3, w:4/16}, {dx:3, dy:2, w:2/16}, {dx:0, dy:1, w:1/16}] },
  // 12: Skip2 Neighbours
  { ntaps: 5, taps: [{dx:4, dy:0, w:6/16}, {dx:-4, dy:3, w:3/16}, {dx:0, dy:4, w:4/16}, {dx:4, dy:3, w:2/16}, {dx:2, dy:1, w:1/16}] },
];

// Bayer matrix threshold calculation
function bayerThreshold(x: number, y: number, n: number): number {
  const bits = (n <= 2) ? 1 : (n <= 4) ? 2 : (n <= 8) ? 3 : 4;
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

// Blue noise isotropic threshold approximation
function blueNoiseThreshold(x: number, y: number, seed: number): number {
  const ux = ((x % 64) + 64) % 64;
  const uy = ((y % 64) + 64) % 64;
  const cellR2 = (cx: number, cy: number) => {
    cx = (cx + 64) & 63;
    cy = (cy + 64) & 63;
    const q = cx * 0.7548776662466927 + cy * 0.5698402909980532;
    const r2 = q - Math.floor(q);
    const h = u01(hash3(cx, cy, seed ^ 0xB10E64));
    return 0.65 * r2 + 0.35 * h;
  };
  const c0 = cellR2(ux, uy);
  let neigh = cellR2(ux - 1, uy) + cellR2(ux + 1, uy) + cellR2(ux, uy - 1) + cellR2(ux, uy + 1);
  neigh += 0.707 * (cellR2(ux - 1, uy - 1) + cellR2(ux + 1, uy - 1) + cellR2(ux - 1, uy + 1) + cellR2(ux + 1, uy + 1));
  neigh /= 6.828;
  const hp = (c0 - neigh) * 2.65;
  const cdf = 0.5 + 0.5 * Math.tanh(hp * 1.15);
  let u = c0 + 0.5 * (c0 - neigh);
  u -= Math.floor(u);
  return clamp(0.55 * cdf + 0.45 * u, 0.001, 0.999);
}

// Continuous spot function evaluated for halftone screens
function spot(id: number, fu: number, fv: number, pu: number, pv: number): number {
  const par = (pu + pv) & 1;
  const du = fu - 0.5;
  const dv = fv - 0.5;
  const tri = (t: number) => { t -= Math.floor(t); return 1 - Math.abs(2 * t - 1); };
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
      return Math.max(Math.abs(du), Math.abs(dv)) * 2;
    case 2: { // S_MOSAIC
      const bx = Math.abs(du) * 2, by = Math.abs(dv) * 2;
      const edge = Math.max(bx, by);
      const dome = Math.sqrt(du * du + dv * dv) * 1.4;
      return edge > 0.82 ? 0.95 + (edge - 0.82) : 0.45 * edge + 0.55 * dome;
    }
    case 3: { // S_RECT
      const bu = frac1(fu + (pv ? 0.5 : 0)) - 0.5;
      return Math.max(Math.abs(bu) * 1.5, Math.abs(dv) * 2.4);
    }
    case 4: // S_LINEH
      return Math.abs(dv) * 2 + 0.04 * tri(fu);
    case 5: { // S_LINEMED
      const su = frac1(fu + (pv ? 0.5 : 0));
      const bridge = su > 0.82 ? 0.32 * (su - 0.82) / 0.18 : 0;
      return Math.abs(dv) * 1.85 + bridge;
    }
    case 6: { // S_LINEHEAVY
      const wave = 0.14 * (tri(fu * 2) - 0.5);
      return Math.abs(dv + wave) * 1.8;
    }
    case 7: // S_LINEV
      return Math.abs(du) * 2 + 0.04 * tri(fv);
    case 8: // S_DIAG
      return Math.abs(frac1((fu + pu + fv + pv) * 0.5) - 0.5) * 2;
    case 9: { // S_DIAG2 (Bitslash)
      const slash = Math.abs(frac1((fu + pu - (fv + pv)) * 0.5) - 0.5) * 2;
      const notch = 0.15 * tri((fu + pu + fv + pv) * 1.5);
      return slash * 0.88 + notch;
    }
    case 10: { // S_HATCH
      const d1 = Math.abs(frac1((fu + pu + fv + pv) * 0.5) - 0.5) * 2;
      const d2 = Math.abs(frac1((fu + pu - (fv + pv)) * 0.5) - 0.5) * 2;
      return d1 < 0.45 ? d1 * 1.1 : 0.5 + 0.5 * Math.min(d1, d2);
    }
    case 11: // S_GRID
      return Math.min(Math.min(fu, 1 - fu), Math.min(fv, 1 - fv)) * 2;
    case 12: { // S_CYBER
      const ax = Math.abs(du) * 2, ay = Math.abs(dv) * 2;
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
      return Math.abs(frac1(fv + w) - 0.5) * 2;
    }
    case 17: { // S_ZIGZAG
      const u2 = (fu + pu) * 0.5;
      const z = 0.38 * (tri(u2 * 2) - 0.5);
      return Math.abs(frac1(fv + z) - 0.5) * 2;
    }
    case 18: { // S_CIRCUIT
      const r = Math.max(Math.abs(du), Math.abs(dv)) * 2;
      const target = par ? 0.32 : 0.68;
      const trace = Math.abs(r - target) * 2.6;
      const pad = Math.max(Math.abs(du), Math.abs(dv)) * 3.5;
      return par ? Math.min(trace, pad) : trace;
    }
    case 19: { // S_STITCHV
      const sv = frac1(fv + (pu ? 0.5 : 0));
      const gap = sv > 0.72 ? (sv - 0.72) * 2.5 : 0;
      return Math.abs(du) * 1.9 + gap;
    }
    case 20: { // S_STITCHH
      const su = frac1(fu + (pv ? 0.5 : 0));
      const gap = su > 0.72 ? (su - 0.72) * 2.5 : 0;
      return Math.abs(dv) * 1.9 + gap;
    }
    case 21: { // S_CLOCK
      const ang = Math.atan2(dv, du) * 0.15915494 + 0.5;
      const rad = Math.sqrt(du * du + dv * dv) * 1.414;
      const blades = tri(ang * 4 + (par ? 0.25 : 0) + rad * 0.35);
      return 0.65 * blades + 0.35 * rad;
    }
    case 22: { // S_BITHREAD
      const d1 = Math.abs(frac1(fu + fv) - 0.5) * 2;
      const d2 = Math.abs(frac1(fu - fv) - 0.5) * 2;
      return par ? (0.75 * d1 + 0.25 * d2) : (0.25 * d1 + 0.75 * d2);
    }
    case 23: { // S_KNIT
      const vloop = fv + Math.abs(du) * 1.35 - 0.32;
      const d1 = Math.abs(frac1(vloop) - 0.5) * 2;
      const rib = Math.abs(du) * 0.55;
      return d1 * 0.78 + rib * 0.22;
    }
    default:
      return 0.5;
  }
}

// Pre-computed 64x64 continuous screen map
const screenCache = new Map<number, Float32Array>();

function getScreenMap(spotId: number): Float32Array {
  if (screenCache.has(spotId)) {
    return screenCache.get(spotId)!;
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
      const tie = (u01(hash3(x, y, 0x5C8EE4)) - 0.5) * 1e-4;
      const idx = y * M + x;
      raw[idx] = spot(spotId, fu, fv, pu, pv) + tie;
      order[idx] = idx;
    }
  }

  // Sort order by ascending raw value
  const orderArr = Array.from(order);
  orderArr.sort((a, b) => raw[a] - raw[b]);

  const map = new Float32Array(M * M);
  const invN = 1.0 / (M * M);
  for (let r = 0; r < M * M; ++r) {
    map[orderArr[r]] = 1.0 - (r + 0.5) * invN;
  }

  screenCache.set(spotId, map);
  return map;
}

function sampleScreenMap(sm: Float32Array, u2: number, v2: number): number {
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
  return lerp(lerp(a, b, dx), lerp(c, d, dx), dy);
}

// Find nearest color in palette
function findNearestPaletteIndex(r: number, g: number, b: number, palette: [number, number, number][]): number {
  let bestDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < palette.length; i++) {
    const pr = palette[i][0];
    const pg = palette[i][1];
    const pb = palette[i][2];
    // Weighted Euclidean perception metric
    const dr = (r - pr) * 0.3;
    const dg = (g - pg) * 0.59;
    const db = (b - pb) * 0.11;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// ----------------------------------------------------------------------------
// Core Dithering Rendering Engine
// ----------------------------------------------------------------------------
export function processDither(
  srcData: ImageData,
  settings: DitherSettings,
  activePaletteRgb: [number, number, number][]
): ImageData {
  const W = srcData.width;
  const H = srcData.height;
  const outData = new ImageData(W, H);
  const src = srcData.data;
  const dst = outData.data;

  const algo = DITHER_ALGOS[Math.max(0, Math.min(DITHER_ALGOS.length - 1, settings.algo))];
  const L = Math.max(2, Math.min(64, settings.levels));
  const contrast = settings.contrast / 100.0;
  const bright = settings.brightness / 100.0;
  const bias = ((50.0 - clamp(settings.threshold, 0, 100)) / 50.0) * 0.45;
  const gam = 2.2;
  const invGam = 1.0 / gam;
  const spread = clamp(settings.strength / 100.0, 0, 2.5);
  const ditherScale = Math.max(1.0, settings.scale);
  const seed = hash3(0x1928, 0, 0xD17E5);

  const darkRgb = hexToRgb(settings.darkColor);
  const lightRgb = hexToRgb(settings.lightColor);
  const midRgb = hexToRgb(settings.midColor);

  // Channels count based on mode:
  // rgb: 3, cmyk: 4, mono/duo/tritone/indexed: 1
  const nch = (settings.mode === 'rgb') ? 3 : (settings.mode === 'cmyk') ? 4 : 1;

  // Pre-process sharpening / blur / noise if requested
  // Create working float buffer [R, G, B, A] in [0, 1]
  const buf = new Float32Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const sIdx = i * 4;
    buf[sIdx]     = src[sIdx] / 255.0;
    buf[sIdx + 1] = src[sIdx + 1] / 255.0;
    buf[sIdx + 2] = src[sIdx + 2] / 255.0;
    buf[sIdx + 3] = src[sIdx + 3] / 255.0;
  }

  // Pre-blur if specified
  if (settings.preBlur > 0) {
    const radius = Math.min(10, Math.floor(settings.preBlur));
    const temp = new Float32Array(W * H * 4);
    temp.set(buf);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let rAcc = 0, gAcc = 0, bAcc = 0, cnt = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= H) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= W) continue;
            const idx = (ny * W + nx) * 4;
            rAcc += temp[idx];
            gAcc += temp[idx + 1];
            bAcc += temp[idx + 2];
            cnt++;
          }
        }
        const oIdx = (y * W + x) * 4;
        buf[oIdx]     = rAcc / cnt;
        buf[oIdx + 1] = gAcc / cnt;
        buf[oIdx + 2] = bAcc / cnt;
      }
    }
  }

  // Pre-sharpen if specified
  if (settings.sharpenStrength > 0) {
    const strength = settings.sharpenStrength / 100.0;
    const temp = new Float32Array(W * H * 4);
    temp.set(buf);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const idx = (y * W + x) * 4;
        for (let c = 0; c < 3; c++) {
          const center = temp[idx + c];
          const lap = 4 * center
            - temp[((y - 1) * W + x) * 4 + c]
            - temp[((y + 1) * W + x) * 4 + c]
            - temp[(y * W + (x - 1)) * 4 + c]
            - temp[(y * W + (x + 1)) * 4 + c];
          buf[idx + c] = clamp(center + lap * strength * 0.5, 0, 1);
        }
      }
    }
  }

  // Pre-noise if specified
  if (settings.preNoise !== 0) {
    const noiseAmt = settings.preNoise / 100.0;
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      const n = (u01(hash3(i, 0x932, seed)) - 0.5) * noiseAmt;
      buf[idx]     = clamp(buf[idx] + n, 0, 1);
      buf[idx + 1] = clamp(buf[idx + 1] + n, 0, 1);
      buf[idx + 2] = clamp(buf[idx + 2] + n, 0, 1);
    }
  }

  // ==========================================================================
  // CASE 1: Continuous Halftone Screen, Bayer, or Stochastic (Ordered)
  // ==========================================================================
  if (algo.kind === 'screen' || algo.kind === 'bayer' || algo.kind === 'blue' || algo.kind === 'ign' || algo.kind === 'white') {
    let screenMap: Float32Array | null = null;
    let pitch = 6.0;

    if (algo.kind === 'screen') {
      screenMap = getScreenMap(algo.param);
      pitch = Math.max(1.0, algo.cell * ditherScale * (Math.max(10, settings.patternScale) / 100.0));
    }

    const bayN = Math.max(2, algo.param);
    const nz = settings.noise / 100.0;
    const cmykAngles = [15.0, 75.0, 0.0, 45.0];
    const cosCh = new Float32Array(nch);
    const sinCh = new Float32Array(nch);

    for (let k = 0; k < nch; ++k) {
      const angDeg = algo.angle + settings.patternAngle + (nch === 4 ? cmykAngles[k] : 0.0);
      const rad = angDeg * (Math.PI / 180.0);
      cosCh[k] = Math.cos(rad);
      sinCh[k] = Math.sin(rad);
    }

    const masterCov = clamp(settings.amount / 100.0, 0, 1);
    const whiteCov  = clamp(settings.whiteAmount / 100.0, 0, 1);
    const blackCov  = clamp(settings.blackAmount / 100.0, 0, 1);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pIdx = (y * W + x) * 4;
        const origR = buf[pIdx];
        const origG = buf[pIdx + 1];
        const origB = buf[pIdx + 2];
        const origA = buf[pIdx + 3];

        // Contrast, Brightness & Invert
        let r = (origR - 0.5) * contrast + 0.5 + bright;
        let g = (origG - 0.5) * contrast + 0.5 + bright;
        let b = (origB - 0.5) * contrast + 0.5 + bright;
        if (settings.invert) { r = 1 - r; g = 1 - g; b = 1 - b; }
        r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
        if (settings.linear) {
          r = Math.pow(r, gam);
          g = Math.pow(g, gam);
          b = Math.pow(b, gam);
        }

        const chVal = [0, 0, 0, 0];
        if (nch === 1) {
          chVal[0] = luma709(r, g, b);
        } else if (nch === 3) {
          chVal[0] = r; chVal[1] = g; chVal[2] = b;
        } else {
          // CMYK
          const kInk = 1.0 - Math.max(r, Math.max(g, b));
          const invOneMinusK = (1.0 - kInk) > 1e-5 ? 1.0 / (1.0 - kInk) : 0;
          chVal[0] = clamp(1.0 - (1.0 - r - kInk) * invOneMinusK, 0, 1); // C
          chVal[1] = clamp(1.0 - (1.0 - g - kInk) * invOneMinusK, 0, 1); // M
          chVal[2] = clamp(1.0 - (1.0 - b - kInk) * invOneMinusK, 0, 1); // Y
          chVal[3] = clamp(1.0 - kInk, 0, 1);                            // K
        }

        const outCh = [0, 0, 0, 0];
        for (let k = 0; k < nch; ++k) {
          let T = 0.5;
          const chSeed = (seed + k * 0x9E37) >>> 0;

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
              let f = 0.06711056 * ((x / ditherScale) + k * 11) + 0.00583715 * ((y / ditherScale) + k * 19);
              f -= Math.floor(f);
              f *= 52.9829189;
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
              const xs = x + 0.5;
              const ys = y + 0.5;
              const u2 = (xs * cosCh[k] + ys * sinCh[k]) / pitch;
              const v2 = (-xs * sinCh[k] + ys * cosCh[k]) / pitch;
              T = sampleScreenMap(screenMap!, u2, v2);
              break;
            }
          }

          if (nz > 0) {
            T = clamp(T + (u01(hash3(x, y, chSeed ^ 0x5A5A)) - 0.5) * nz, 0, 1);
          }
          T = clamp(0.5 + (T - 0.5) * spread, 0.001, 0.999);
          const val = clamp(chVal[k] + bias, 0, 1);
          const scaled = val * (L - 1);
          const q = Math.floor(scaled + T);
          let res = clamp(q / (L - 1), 0, 1);
          if (settings.linear) res = Math.pow(res, invGam);
          outCh[k] = res;
        }

        let finalR = 0, finalG = 0, finalB = 0;
        if (settings.mode === 'rgb') {
          finalR = outCh[0]; finalG = outCh[1]; finalB = outCh[2];
        } else if (settings.mode === 'mono') {
          finalR = outCh[0]; finalG = outCh[0]; finalB = outCh[0];
        } else if (settings.mode === 'duo') {
          finalR = lerp(darkRgb[0], lightRgb[0], outCh[0]);
          finalG = lerp(darkRgb[1], lightRgb[1], outCh[0]);
          finalB = lerp(darkRgb[2], lightRgb[2], outCh[0]);
        } else if (settings.mode === 'cmyk') {
          const kMul = outCh[3];
          finalR = clamp(outCh[0] * kMul, 0, 1);
          finalG = clamp(outCh[1] * kMul, 0, 1);
          finalB = clamp(outCh[2] * kMul, 0, 1);
        } else if (settings.mode === 'tritone') {
          const l = outCh[0];
          if (l < 0.5) {
            const t = l * 2;
            finalR = lerp(darkRgb[0], midRgb[0], t);
            finalG = lerp(darkRgb[1], midRgb[1], t);
            finalB = lerp(darkRgb[2], midRgb[2], t);
          } else {
            const t = (l - 0.5) * 2;
            finalR = lerp(midRgb[0], lightRgb[0], t);
            finalG = lerp(midRgb[1], lightRgb[1], t);
            finalB = lerp(midRgb[2], lightRgb[2], t);
          }
        } else if (settings.mode === 'indexed') {
          // Continuous threshold mapped across palette swatches
          const palLen = activePaletteRgb.length;
          if (palLen > 0) {
            const palIdx = Math.min(palLen - 1, Math.floor(outCh[0] * palLen));
            finalR = activePaletteRgb[palIdx][0];
            finalG = activePaletteRgb[palIdx][1];
            finalB = activePaletteRgb[palIdx][2];
          }
        }

        // True Dot Density Gating
        let prob = masterCov;
        let gateSeed = 0x51A7;
        if (settings.mode === 'mono') {
          if (outCh[0] >= 0.5) {
            prob = masterCov * whiteCov;
            gateSeed = 0x93E1;
          } else {
            prob = masterCov * blackCov;
            gateSeed = 0x48D2;
          }
        }

        const gate = u01(hash3(x, y, seed ^ gateSeed));
        if (gate < prob) {
          dst[pIdx]     = Math.round(finalR * 255);
          dst[pIdx + 1] = Math.round(finalG * 255);
          dst[pIdx + 2] = Math.round(finalB * 255);
        } else {
          // Original image pixel under transparent dot gate
          dst[pIdx]     = Math.round(origR * 255);
          dst[pIdx + 1] = Math.round(origG * 255);
          dst[pIdx + 2] = Math.round(origB * 255);
        }
        dst[pIdx + 3] = Math.round(origA * 255);
      }
    }

    return outData;
  }

  // ==========================================================================
  // CASE 2: Error Diffusion Algorithms (15 kernels)
  // ==========================================================================
  const block = (settings.pixelate && ditherScale > 1.0) ? Math.max(1, Math.floor(ditherScale + 0.5)) : 1;
  const gw = Math.max(1, Math.floor((W + block - 1) / block));
  const gh = Math.max(1, Math.floor((H + block - 1) / block));

  const planes: Float32Array[] = [];
  for (let c = 0; c < nch; c++) {
    planes.push(new Float32Array(gw * gh));
  }

  // Fill downscaled / initial planes
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      let r = 0, g = 0, b = 0;
      if (block <= 1) {
        const sIdx = (gy * W + gx) * 4;
        r = buf[sIdx]; g = buf[sIdx + 1]; b = buf[sIdx + 2];
      } else {
        let accR = 0, accG = 0, accB = 0, cnt = 0;
        const xStart = gx * block, yStart = gy * block;
        const xe = Math.min(W, xStart + block), ye = Math.min(H, yStart + block);
        for (let y = yStart; y < ye; y++) {
          for (let x = xStart; x < xe; x++) {
            const idx = (y * W + x) * 4;
            accR += buf[idx]; accG += buf[idx + 1]; accB += buf[idx + 2];
            cnt++;
          }
        }
        const invCnt = cnt > 0 ? 1.0 / cnt : 0;
        r = accR * invCnt; g = accG * invCnt; b = accB * invCnt;
      }

      // Contrast & Brightness
      r = (r - 0.5) * contrast + 0.5 + bright;
      g = (g - 0.5) * contrast + 0.5 + bright;
      b = (b - 0.5) * contrast + 0.5 + bright;
      if (settings.invert) { r = 1 - r; g = 1 - g; b = 1 - b; }
      r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
      if (settings.linear) {
        r = Math.pow(r, gam);
        g = Math.pow(g, gam);
        b = Math.pow(b, gam);
      }

      const gi = gy * gw + gx;
      if (nch === 1) {
        planes[0][gi] = luma709(r, g, b);
      } else if (nch === 3) {
        planes[0][gi] = r; planes[1][gi] = g; planes[2][gi] = b;
      } else {
        const kInk = 1.0 - Math.max(r, Math.max(g, b));
        const invOneMinusK = (1.0 - kInk) > 1e-5 ? 1.0 / (1.0 - kInk) : 0;
        planes[0][gi] = clamp(1.0 - (1.0 - r - kInk) * invOneMinusK, 0, 1);
        planes[1][gi] = clamp(1.0 - (1.0 - g - kInk) * invOneMinusK, 0, 1);
        planes[2][gi] = clamp(1.0 - (1.0 - b - kInk) * invOneMinusK, 0, 1);
        planes[3][gi] = clamp(1.0 - kInk, 0, 1);
      }
    }
  }

  const kid = algo.param & 255;
  const kernel = KERNELS[Math.max(0, Math.min(KERNELS.length - 1, kid))];
  const isSerp = settings.serpentine || ((algo.param & 256) !== 0);
  const isXerox = (algo.param & 1024) !== 0;
  const errorNoise = (settings.noise / 100.0) + ((algo.param & 512) ? 0.55 : 0.0);

  // Xerox pre-pass edge boost
  if (isXerox && gw > 2 && gh > 2) {
    for (let c = 0; c < nch; c++) {
      const orig = new Float32Array(planes[c]);
      for (let y = 1; y < gh - 1; y++) {
        for (let x = 1; x < gw - 1; x++) {
          const center = orig[y * gw + x];
          const lap = 4 * center - orig[(y - 1) * gw + x] - orig[(y + 1) * gw + x] - orig[y * gw + (x - 1)] - orig[y * gw + (x + 1)];
          const toner = (u01(hash3(x, y, seed ^ 0x7E80)) - 0.5) * 0.12;
          planes[c][y * gw + x] = clamp(center + lap * 0.55 + toner, 0, 1);
        }
      }
    }
  }

  // Diffuse each plane
  const invLm1 = 1.0 / Math.max(1, L - 1);
  for (let c = 0; c < nch; c++) {
    const pl = planes[c];
    for (let y = 0; y < gh; y++) {
      const rev = isSerp && ((y & 1) === 1);
      for (let i = 0; i < gw; i++) {
        const x = rev ? gw - 1 - i : i;
        const gi = y * gw + x;
        const v = clamp(pl[gi], -0.35, 1.35);
        let t = v;
        if (errorNoise > 0) {
          t += (u01(hash3(x, y, seed + c * 193)) - 0.5) * errorNoise * invLm1;
        }

        // Quantize
        const shifted = clamp(t + bias, 0, 1);
        const q = Math.floor(shifted * (L - 1) + 0.5) / (L - 1);
        const err = clamp((v - q) * spread, -1.0, 1.0);
        pl[gi] = q;

        // Distribute error
        for (let ti = 0; ti < kernel.ntaps; ti++) {
          const tap = kernel.taps[ti];
          const nx = x + (rev ? -tap.dx : tap.dx);
          const ny = y + tap.dy;
          if (nx >= 0 && nx < gw && ny >= 0 && ny < gh) {
            pl[ny * gw + nx] += err * tap.w;
          }
        }
      }
    }
  }

  // Composite final result
  const masterCov = clamp(settings.amount / 100.0, 0, 1);
  const whiteCov  = clamp(settings.whiteAmount / 100.0, 0, 1);
  const blackCov  = clamp(settings.blackAmount / 100.0, 0, 1);

  for (let y = 0; y < H; y++) {
    const gy = Math.min(gh - 1, Math.floor(y / block));
    for (let x = 0; x < W; x++) {
      const gx = Math.min(gw - 1, Math.floor(x / block));
      const gi = gy * gw + gx;
      const pIdx = (y * W + x) * 4;

      const v = [0, 0, 0, 0];
      for (let c = 0; c < nch; c++) {
        let t = clamp(planes[c][gi], 0, 1);
        if (settings.linear) t = Math.pow(t, invGam);
        v[c] = t;
      }

      let finalR = 0, finalG = 0, finalB = 0;
      if (settings.mode === 'rgb') {
        finalR = v[0]; finalG = v[1]; finalB = v[2];
      } else if (settings.mode === 'mono') {
        finalR = v[0]; finalG = v[0]; finalB = v[0];
      } else if (settings.mode === 'duo') {
        finalR = lerp(darkRgb[0], lightRgb[0], v[0]);
        finalG = lerp(darkRgb[1], lightRgb[1], v[0]);
        finalB = lerp(darkRgb[2], lightRgb[2], v[0]);
      } else if (settings.mode === 'cmyk') {
        const kMul = v[3];
        finalR = clamp(v[0] * kMul, 0, 1);
        finalG = clamp(v[1] * kMul, 0, 1);
        finalB = clamp(v[2] * kMul, 0, 1);
      } else if (settings.mode === 'tritone') {
        const l = v[0];
        if (l < 0.5) {
          const t = l * 2;
          finalR = lerp(darkRgb[0], midRgb[0], t);
          finalG = lerp(darkRgb[1], midRgb[1], t);
          finalB = lerp(darkRgb[2], midRgb[2], t);
        } else {
          const t = (l - 0.5) * 2;
          finalR = lerp(midRgb[0], lightRgb[0], t);
          finalG = lerp(midRgb[1], lightRgb[1], t);
          finalB = lerp(midRgb[2], lightRgb[2], t);
        }
      } else if (settings.mode === 'indexed') {
        const palLen = activePaletteRgb.length;
        if (palLen > 0) {
          const palIdx = Math.min(palLen - 1, Math.floor(v[0] * palLen));
          finalR = activePaletteRgb[palIdx][0];
          finalG = activePaletteRgb[palIdx][1];
          finalB = activePaletteRgb[palIdx][2];
        }
      }

      let prob = masterCov;
      let gateSeed = 0x51A7;
      if (settings.mode === 'mono') {
        if (v[0] >= 0.5) {
          prob = masterCov * whiteCov;
          gateSeed = 0x93E1;
        } else {
          prob = masterCov * blackCov;
          gateSeed = 0x48D2;
        }
      }

      const gate = u01(hash3(x, y, seed ^ gateSeed));
      if (gate < prob) {
        dst[pIdx]     = Math.round(finalR * 255);
        dst[pIdx + 1] = Math.round(finalG * 255);
        dst[pIdx + 2] = Math.round(finalB * 255);
      } else {
        dst[pIdx]     = Math.round(buf[pIdx] * 255);
        dst[pIdx + 1] = Math.round(buf[pIdx + 1] * 255);
        dst[pIdx + 2] = Math.round(buf[pIdx + 2] * 255);
      }
      dst[pIdx + 3] = Math.round(buf[pIdx + 3] * 255);
    }
  }

  return outData;
}
