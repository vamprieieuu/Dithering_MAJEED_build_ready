import { DitherAlgoInfo } from '../types';

export const F_SERP = 256;
export const F_NOISE = 512;
export const F_XEROX = 1024;

// ------------------------------------------------------------ Error diffusion kernels
export interface DiffusionTap {
  dx: number;
  dy: number;
  w: number;
}

export interface KernelDef {
  ntaps: number;
  taps: DiffusionTap[];
}

export const KERNELS: KernelDef[] = [
  // 0: Floyd-Steinberg (7, 3, 5, 1) / 16
  {
    ntaps: 4,
    taps: [
      { dx: 1, dy: 0, w: 7 / 16 },
      { dx: -1, dy: 1, w: 3 / 16 },
      { dx: 0, dy: 1, w: 5 / 16 },
      { dx: 1, dy: 1, w: 1 / 16 },
    ],
  },
  // 1: Jarvis-Judice-Ninke / 48
  {
    ntaps: 12,
    taps: [
      { dx: 1, dy: 0, w: 7 / 48 }, { dx: 2, dy: 0, w: 5 / 48 },
      { dx: -2, dy: 1, w: 3 / 48 }, { dx: -1, dy: 1, w: 5 / 48 }, { dx: 0, dy: 1, w: 7 / 48 }, { dx: 1, dy: 1, w: 5 / 48 }, { dx: 2, dy: 1, w: 3 / 48 },
      { dx: -2, dy: 2, w: 1 / 48 }, { dx: -1, dy: 2, w: 3 / 48 }, { dx: 0, dy: 2, w: 5 / 48 }, { dx: 1, dy: 2, w: 3 / 48 }, { dx: 2, dy: 2, w: 1 / 48 },
    ],
  },
  // 2: Stucki / 42
  {
    ntaps: 12,
    taps: [
      { dx: 1, dy: 0, w: 8 / 42 }, { dx: 2, dy: 0, w: 4 / 42 },
      { dx: -2, dy: 1, w: 2 / 42 }, { dx: -1, dy: 1, w: 4 / 42 }, { dx: 0, dy: 1, w: 8 / 42 }, { dx: 1, dy: 1, w: 4 / 42 }, { dx: 2, dy: 1, w: 2 / 42 },
      { dx: -2, dy: 2, w: 1 / 42 }, { dx: -1, dy: 2, w: 2 / 42 }, { dx: 0, dy: 2, w: 4 / 42 }, { dx: 1, dy: 2, w: 2 / 42 }, { dx: 2, dy: 2, w: 1 / 42 },
    ],
  },
  // 3: Atkinson (Diffuses 6/8 of the error for high-contrast crispness)
  {
    ntaps: 6,
    taps: [
      { dx: 1, dy: 0, w: 1 / 8 }, { dx: 2, dy: 0, w: 1 / 8 },
      { dx: -1, dy: 1, w: 1 / 8 }, { dx: 0, dy: 1, w: 1 / 8 }, { dx: 1, dy: 1, w: 1 / 8 },
      { dx: 0, dy: 2, w: 1 / 8 },
    ],
  },
  // 4: Burkes / 32
  {
    ntaps: 7,
    taps: [
      { dx: 1, dy: 0, w: 8 / 32 }, { dx: 2, dy: 0, w: 4 / 32 },
      { dx: -2, dy: 1, w: 2 / 32 }, { dx: -1, dy: 1, w: 4 / 32 }, { dx: 0, dy: 1, w: 8 / 32 }, { dx: 1, dy: 1, w: 4 / 32 }, { dx: 2, dy: 1, w: 2 / 32 },
    ],
  },
  // 5: Sierra-3 / 32
  {
    ntaps: 10,
    taps: [
      { dx: 1, dy: 0, w: 5 / 32 }, { dx: 2, dy: 0, w: 3 / 32 },
      { dx: -2, dy: 1, w: 2 / 32 }, { dx: -1, dy: 1, w: 4 / 32 }, { dx: 0, dy: 1, w: 5 / 32 }, { dx: 1, dy: 1, w: 4 / 32 }, { dx: 2, dy: 1, w: 2 / 32 },
      { dx: -1, dy: 2, w: 2 / 32 }, { dx: 0, dy: 2, w: 3 / 32 }, { dx: 1, dy: 2, w: 2 / 32 },
    ],
  },
  // 6: Sierra Two-Row / 16
  {
    ntaps: 7,
    taps: [
      { dx: 1, dy: 0, w: 4 / 16 }, { dx: 2, dy: 0, w: 3 / 16 },
      { dx: -2, dy: 1, w: 1 / 16 }, { dx: -1, dy: 1, w: 2 / 16 }, { dx: 0, dy: 1, w: 3 / 16 }, { dx: 1, dy: 1, w: 2 / 16 }, { dx: 2, dy: 1, w: 1 / 16 },
    ],
  },
  // 7: Sierra Lite / 4
  {
    ntaps: 3,
    taps: [
      { dx: 1, dy: 0, w: 2 / 4 },
      { dx: -1, dy: 1, w: 1 / 4 }, { dx: 0, dy: 1, w: 1 / 4 },
    ],
  },
  // 8: Fan / 16
  {
    ntaps: 4,
    taps: [
      { dx: 1, dy: 0, w: 7 / 16 },
      { dx: -2, dy: 1, w: 1 / 16 }, { dx: -1, dy: 1, w: 3 / 16 }, { dx: 0, dy: 1, w: 5 / 16 },
    ],
  },
  // 9: Shiau-Fan / 16
  {
    ntaps: 5,
    taps: [
      { dx: 1, dy: 0, w: 8 / 16 },
      { dx: -3, dy: 1, w: 1 / 16 }, { dx: -2, dy: 1, w: 1 / 16 }, { dx: -1, dy: 1, w: 2 / 16 }, { dx: 0, dy: 1, w: 4 / 16 },
    ],
  },
  // 10: Skip Neighbours
  {
    ntaps: 4,
    taps: [
      { dx: 2, dy: 0, w: 7 / 16 },
      { dx: -2, dy: 2, w: 3 / 16 }, { dx: 0, dy: 2, w: 5 / 16 }, { dx: 2, dy: 2, w: 1 / 16 },
    ],
  },
  // 11: Skip1 Neighbours
  {
    ntaps: 5,
    taps: [
      { dx: 3, dy: 0, w: 6 / 16 },
      { dx: -3, dy: 2, w: 3 / 16 }, { dx: 0, dy: 3, w: 4 / 16 }, { dx: 3, dy: 2, w: 2 / 16 }, { dx: 0, dy: 1, w: 1 / 16 },
    ],
  },
  // 12: Skip2 Neighbours
  {
    ntaps: 5,
    taps: [
      { dx: 4, dy: 0, w: 6 / 16 },
      { dx: -4, dy: 3, w: 3 / 16 }, { dx: 0, dy: 4, w: 4 / 16 }, { dx: 4, dy: 3, w: 2 / 16 }, { dx: 2, dy: 1, w: 1 / 16 },
    ],
  },
];

// ------------------------------------------------------------ 27 Spot Functions
export enum SpotId {
  S_DOT = 0,
  S_SQUARE,
  S_MOSAIC,
  S_RECT,
  S_LINEH,
  S_LINEMED,
  S_LINEHEAVY,
  S_LINEV,
  S_DIAG,
  S_DIAG2,
  S_HATCH,
  S_GRID,
  S_CYBER,
  S_CROSS,
  S_DIAMOND,
  S_STAR,
  S_WAVE,
  S_ZIGZAG,
  S_CIRCUIT,
  S_STITCHV,
  S_STITCHH,
  S_CLOCK,
  S_BITHREAD,
  S_KNIT,
}

function tri(t: number): number {
  t -= Math.floor(t);
  return 1 - Math.abs(2 * t - 1);
}

function frac1(t: number): number {
  return t - Math.floor(t);
}

export function spot(id: SpotId, fu: number, fv: number, pu: number, pv: number): number {
  const par = (pu + pv) & 1;
  const du = fu - 0.5;
  const dv = fv - 0.5;

  switch (id) {
    case SpotId.S_DOT: {
      const d1 = Math.sqrt(du * du + dv * dv);
      const c2u = (fu < 0.5 ? fu + 0.5 : fu - 0.5) - 0.5;
      const c2v = (fv < 0.5 ? fv + 0.5 : fv - 0.5) - 0.5;
      const d2 = Math.sqrt(c2u * c2u + c2v * c2v);
      return 0.5 + (d1 - d2) * 0.7071;
    }
    case SpotId.S_SQUARE:
      return Math.max(Math.abs(du), Math.abs(dv)) * 2;
    case SpotId.S_MOSAIC: {
      const bx = Math.abs(du) * 2;
      const by = Math.abs(dv) * 2;
      const edge = Math.max(bx, by);
      const dome = Math.sqrt(du * du + dv * dv) * 1.4;
      return edge > 0.82 ? 0.95 + (edge - 0.82) : 0.45 * edge + 0.55 * dome;
    }
    case SpotId.S_RECT: {
      const bu = frac1(fu + (pv ? 0.5 : 0)) - 0.5;
      return Math.max(Math.abs(bu) * 1.5, Math.abs(dv) * 2.4);
    }
    case SpotId.S_LINEH:
      return Math.abs(dv) * 2 + 0.04 * tri(fu);
    case SpotId.S_LINEMED: {
      const su = frac1(fu + (pv ? 0.5 : 0));
      const bridge = su > 0.82 ? (0.32 * (su - 0.82)) / 0.18 : 0;
      return Math.abs(dv) * 1.85 + bridge;
    }
    case SpotId.S_LINEHEAVY: {
      const wave = 0.14 * (tri(fu * 2) - 0.5);
      return Math.abs(dv + wave) * 1.8;
    }
    case SpotId.S_LINEV:
      return Math.abs(du) * 2 + 0.04 * tri(fv);
    case SpotId.S_DIAG:
      return Math.abs(frac1((fu + pu + fv + pv) * 0.5) - 0.5) * 2;
    case SpotId.S_DIAG2: {
      const slash = Math.abs(frac1((fu + pu - (fv + pv)) * 0.5) - 0.5) * 2;
      const notch = 0.15 * tri((fu + pu + fv + pv) * 1.5);
      return slash * 0.88 + notch;
    }
    case SpotId.S_HATCH: {
      const d1 = Math.abs(frac1((fu + pu + fv + pv) * 0.5) - 0.5) * 2;
      const d2 = Math.abs(frac1((fu + pu - (fv + pv)) * 0.5) - 0.5) * 2;
      return d1 < 0.45 ? d1 * 1.1 : 0.5 + 0.5 * Math.min(d1, d2);
    }
    case SpotId.S_GRID:
      return Math.min(Math.min(fu, 1 - fu), Math.min(fv, 1 - fv)) * 2;
    case SpotId.S_CYBER: {
      const ax = Math.abs(du) * 2;
      const ay = Math.abs(dv) * 2;
      const oct = Math.max(Math.max(ax, ay), (ax + ay) * 0.72);
      const ring = Math.abs(oct - 0.68) * 2.2;
      const core = (ax + ay) * 1.4;
      return Math.min(ring, core + 0.25);
    }
    case SpotId.S_CROSS: {
      const arm = Math.min(Math.abs(du), Math.abs(dv)) * 2.4;
      const span = Math.max(Math.abs(du), Math.abs(dv)) * 0.65;
      return arm + span;
    }
    case SpotId.S_DIAMOND:
      return Math.abs(du) + Math.abs(dv);
    case SpotId.S_STAR: {
      const a = Math.pow(Math.abs(du) + 1e-4, 0.55) + Math.pow(Math.abs(dv) + 1e-4, 0.55);
      return a * a * 0.85;
    }
    case SpotId.S_WAVE: {
      const u2 = (fu + pu) * 0.5;
      const w = 0.28 * Math.sin(6.2831853 * u2);
      return Math.abs(frac1(fv + w) - 0.5) * 2;
    }
    case SpotId.S_ZIGZAG: {
      const u2 = (fu + pu) * 0.5;
      const z = 0.38 * (tri(u2 * 2) - 0.5);
      return Math.abs(frac1(fv + z) - 0.5) * 2;
    }
    case SpotId.S_CIRCUIT: {
      const r = Math.max(Math.abs(du), Math.abs(dv)) * 2;
      const target = par ? 0.32 : 0.68;
      const trace = Math.abs(r - target) * 2.6;
      const pad = Math.max(Math.abs(du), Math.abs(dv)) * 3.5;
      return par ? Math.min(trace, pad) : trace;
    }
    case SpotId.S_STITCHV: {
      const sv = frac1(fv + (pu ? 0.5 : 0));
      const gap = sv > 0.72 ? (sv - 0.72) * 2.5 : 0;
      return Math.abs(du) * 1.9 + gap;
    }
    case SpotId.S_STITCHH: {
      const su = frac1(fu + (pv ? 0.5 : 0));
      const gap = su > 0.72 ? (su - 0.72) * 2.5 : 0;
      return Math.abs(dv) * 1.9 + gap;
    }
    case SpotId.S_CLOCK: {
      const ang = Math.atan2(dv, du) * 0.15915494 + 0.5;
      const rad = Math.sqrt(du * du + dv * dv) * 1.414;
      const blades = tri(ang * 4 + (par ? 0.25 : 0) + rad * 0.35);
      return 0.65 * blades + 0.35 * rad;
    }
    case SpotId.S_BITHREAD: {
      const d1 = Math.abs(frac1(fu + fv) - 0.5) * 2;
      const d2 = Math.abs(frac1(fu - fv) - 0.5) * 2;
      return par ? 0.75 * d1 + 0.25 * d2 : 0.25 * d1 + 0.75 * d2;
    }
    case SpotId.S_KNIT: {
      const vloop = fv + Math.abs(du) * 1.35 - 0.32;
      const d1 = Math.abs(frac1(vloop) - 0.5) * 2;
      const rib = Math.abs(du) * 0.55;
      return d1 * 0.78 + rib * 0.22;
    }
  }
  return 0.5;
}

// ------------------------------------------------------------ Screen Map Cache (64x64)
const screenMapCache = new Map<number, Float32Array>();

export function getScreenMap(id: SpotId): Float32Array {
  if (screenMapCache.has(id)) {
    return screenMapCache.get(id)!;
  }
  const M = 64;
  const raw = new Float32Array(M * M);
  const order: number[] = new Array(M * M);

  for (let y = 0; y < M; ++y) {
    for (let x = 0; x < M; ++x) {
      const u2 = (x + 0.5) * (2 / M);
      const v2 = (y + 0.5) * (2 / M);
      let pu = Math.floor(u2);
      if (pu > 1) pu = 1;
      let pv = Math.floor(v2);
      if (pv > 1) pv = 1;
      const fu = u2 - pu;
      const fv = v2 - pv;
      const idx = y * M + x;
      // Slight deterministic dither to break ties cleanly
      const tie = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 - 0.5) * 1e-4;
      raw[idx] = spot(id, fu, fv, pu, pv) + tie;
      order[idx] = idx;
    }
  }

  order.sort((a, b) => raw[a] - raw[b]);

  const map = new Float32Array(M * M);
  const invN = 1 / (M * M);
  for (let r = 0; r < M * M; ++r) {
    map[order[r]] = 1 - (r + 0.5) * invN;
  }

  screenMapCache.set(id, map);
  return map;
}

export function sampleScreen(map: Float32Array, u2: number, v2: number): number {
  let tu = u2 * 0.5;
  tu -= Math.floor(tu);
  let tv = v2 * 0.5;
  tv -= Math.floor(tv);

  const fx = Math.max(0, Math.min(63.999, tu * 64 - 0.5));
  const fy = Math.max(0, Math.min(63.999, tv * 64 - 0.5));

  const x0 = Math.floor(fx) & 63;
  const y0 = Math.floor(fy) & 63;
  const x1 = (x0 + 1) & 63;
  const y1 = (y0 + 1) & 63;

  const dx = fx - Math.floor(fx);
  const dy = fy - Math.floor(fy);

  const a = map[y0 * 64 + x0];
  const b = map[y0 * 64 + x1];
  const c = map[y1 * 64 + x0];
  const d = map[y1 * 64 + x1];

  const top = a + (b - a) * dx;
  const bottom = c + (d - c) * dx;
  return top + (bottom - top) * dy;
}

// ------------------------------------------------------------ Bayer Matrices
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

// ------------------------------------------------------------ Blue Noise & IGN
export function blueNoiseThreshold(x: number, y: number, seed: number = 0): number {
  const ux = ((x % 64) + 64) % 64;
  const uy = ((y % 64) + 64) % 64;
  const cellR2 = (cx: number, cy: number) => {
    const px = (cx + 64) & 63;
    const py = (cy + 64) & 63;
    const q = px * 0.7548776662466927 + py * 0.5698402909980532;
    const r2 = q - Math.floor(q);
    const h = ((Math.sin(px * 12.9898 + py * 78.233 + seed) * 43758.5453) % 1 + 1) % 1;
    return 0.65 * r2 + 0.35 * h;
  };
  const c0 = cellR2(ux, uy);
  let neigh =
    cellR2(ux - 1, uy) +
    cellR2(ux + 1, uy) +
    cellR2(ux, uy - 1) +
    cellR2(ux, uy + 1) +
    0.707 *
      (cellR2(ux - 1, uy - 1) +
        cellR2(ux + 1, uy - 1) +
        cellR2(ux - 1, uy + 1) +
        cellR2(ux + 1, uy + 1));
  neigh /= 6.828;
  const hp = (c0 - neigh) * 2.65;
  const cdf = 0.5 + 0.5 * Math.tanh(hp * 1.15);
  let u = c0 + 0.5 * (c0 - neigh);
  u -= Math.floor(u);
  return Math.max(0.001, Math.min(0.999, 0.55 * cdf + 0.45 * u));
}

export function ignThreshold(x: number, y: number): number {
  let f = 0.06711056 * x + 0.00583715 * y;
  f -= Math.floor(f);
  f *= 52.9829189;
  return f - Math.floor(f);
}

// ------------------------------------------------------------ 49 Full Algorithm List
export const ALL_DITHER_ALGORITHMS: DitherAlgoInfo[] = [
  // DIFFUSION (0-14)
  { id: 0, name: 'Floyd-Steinberg', category: 'DIFFUSION', kind: 'error', param: 0, cell: 0, angle: 0, desc: 'Classic error diffusion 7-3-5-1 /16' },
  { id: 1, name: 'Floyd-Steinberg Serpentine', category: 'DIFFUSION', kind: 'error', param: 0 | F_SERP, cell: 0, angle: 0, desc: 'Floyd-Steinberg with alternating scan direction to avoid directional worming' },
  { id: 2, name: 'Jarvis-Judice-Ninke', category: 'DIFFUSION', kind: 'error', param: 1, cell: 0, angle: 0, desc: '3-row 12-tap wide diffusion kernel /48' },
  { id: 3, name: 'Stucki', category: 'DIFFUSION', kind: 'error', param: 2, cell: 0, angle: 0, desc: '3-row 12-tap sharp edge diffusion kernel /42' },
  { id: 4, name: 'Atkinson', category: 'DIFFUSION', kind: 'error', param: 3, cell: 0, angle: 0, desc: 'Diffuses 6/8 of error for hyper-contrast crispness (Original Mac OS)' },
  { id: 5, name: 'Burkes', category: 'DIFFUSION', kind: 'error', param: 4, cell: 0, angle: 0, desc: '2-row 7-tap balanced kernel /32' },
  { id: 6, name: 'Sierra (Sierra-3)', category: 'SIERRA', kind: 'error', param: 5, cell: 0, angle: 0, desc: 'Sierra-3, 3-row 10-tap organic kernel /32' },
  { id: 7, name: 'Sierra Two-Row', category: 'SIERRA', kind: 'error', param: 6, cell: 0, angle: 0, desc: 'Sierra-2, 2-row 7-tap fast kernel /16' },
  { id: 8, name: 'Sierra Lite', category: 'SIERRA', kind: 'error', param: 7, cell: 0, angle: 0, desc: 'Sierra Lite 2-1-1 /4 rapid diffusion' },
  { id: 9, name: 'Fan', category: 'DIFFUSION', kind: 'error', param: 8, cell: 0, angle: 0, desc: 'Fan 4-tap kernel /16' },
  { id: 10, name: 'Shiau-Fan', category: 'DIFFUSION', kind: 'error', param: 9, cell: 0, angle: 0, desc: 'Shiau-Fan 5-tap wide-fan kernel /16' },
  { id: 11, name: 'Skip Neighbours', category: 'SKIP NEIGHBOURS', kind: 'error', param: 10, cell: 0, angle: 0, desc: '2-px step woven cluster error diffusion' },
  { id: 12, name: 'Skip1 Neighbours', category: 'SKIP NEIGHBOURS', kind: 'error', param: 11, cell: 0, angle: 0, desc: '3-px step structured stipple diffusion' },
  { id: 13, name: 'Skip2 Neighbours', category: 'SKIP NEIGHBOURS', kind: 'error', param: 12, cell: 0, angle: 0, desc: '4-px step cross-weave diffusion' },
  { id: 14, name: 'Xerox Grain', category: 'DIFFUSION', kind: 'error', param: 0 | F_SERP | F_NOISE | F_XEROX, cell: 0, angle: 0, desc: 'Photocopy toner edge boost + grainy serpentine diffusion' },

  // BAYER / ORDERED (15-21)
  { id: 15, name: 'Bayer 2x2', category: 'BAYER', kind: 'bayer', param: 2, cell: 0, angle: 0, desc: 'Ordered dither, 2x2 micro matrix' },
  { id: 16, name: 'Bayer 4x4', category: 'BAYER', kind: 'bayer', param: 4, cell: 0, angle: 0, desc: 'Ordered dither, 4x4 classic retro matrix' },
  { id: 17, name: 'Bayer 8x8', category: 'BAYER', kind: 'bayer', param: 8, cell: 0, angle: 0, desc: 'Ordered dither, 8x8 deep tonal matrix' },
  { id: 18, name: 'Bayer 16x16', category: 'BAYER', kind: 'bayer', param: 16, cell: 0, angle: 0, desc: 'Ordered dither, 16x16 ultra-fine matrix' },
  { id: 19, name: 'Blue Noise', category: 'OTHER', kind: 'blue', param: 0, cell: 0, angle: 0, desc: 'Isotropic high-frequency blue-noise field' },
  { id: 20, name: 'Interleaved Gradient Noise', category: 'OTHER', kind: 'ign', param: 0, cell: 0, angle: 0, desc: 'Jimenez spiral interleaved gradient noise' },
  { id: 21, name: 'White Noise', category: 'OTHER', kind: 'white', param: 0, cell: 0, angle: 0, desc: 'Stochastic random threshold per dither cell' },

  // HALFTONE & CONTINUOUS SPOT SCREENS (22-48)
  { id: 22, name: 'Halftone', category: 'HALFTONE', kind: 'screen', param: SpotId.S_DOT, cell: 8, angle: 0, desc: 'Round-dot halftone screen, 0 deg' },
  { id: 23, name: 'Halftone 22.5°', category: 'HALFTONE', kind: 'screen', param: SpotId.S_DOT, cell: 8, angle: 22.5, desc: 'Round-dot halftone screen, 22.5 deg offset' },
  { id: 24, name: 'Halftone 45°', category: 'HALFTONE', kind: 'screen', param: SpotId.S_DOT, cell: 8, angle: 45, desc: 'Round-dot newspaper halftone screen, 45 deg' },
  { id: 25, name: 'Matrix', category: 'PATTERN', kind: 'screen', param: SpotId.S_DOT, cell: 4, angle: 45, desc: 'Fine LED / CRT dot matrix, 45 deg' },
  { id: 26, name: 'Square Halftone', category: 'MOSAIC', kind: 'screen', param: SpotId.S_SQUARE, cell: 8, angle: 0, desc: 'Crisp expanding square-dot screen' },
  { id: 27, name: 'Mosaic Halftone', category: 'MOSAIC', kind: 'screen', param: SpotId.S_MOSAIC, cell: 6, angle: 0, desc: 'Beveled cushion mosaic tile screen' },
  { id: 28, name: 'Rekt Block', category: 'PATTERN', kind: 'screen', param: SpotId.S_RECT, cell: 8, angle: 0, desc: 'Staggered 2:1 rectangular brick screen' },
  { id: 29, name: 'Row Modulation', category: 'MODULATION', kind: 'screen', param: SpotId.S_LINEH, cell: 4, angle: 0, desc: 'Fine horizontal scanline PWM screen' },
  { id: 30, name: 'Medium Modulation', category: 'MODULATION', kind: 'screen', param: SpotId.S_LINEMED, cell: 6, angle: 0, desc: 'Notched CRT slot-mask horizontal modulation' },
  { id: 31, name: 'Heavy Modulation', category: 'MODULATION', kind: 'screen', param: SpotId.S_LINEHEAVY, cell: 9, angle: 0, desc: 'Bold serrated horizontal bar screen' },
  { id: 32, name: 'Column Modulation', category: 'MODULATION', kind: 'screen', param: SpotId.S_LINEV, cell: 5, angle: 0, desc: 'Vertical aperture-grille bar modulation' },
  { id: 33, name: 'Tilt Modulation', category: 'MODULATION', kind: 'screen', param: SpotId.S_DIAG, cell: 6, angle: 0, desc: '+45 deg engraving diagonal line screen' },
  { id: 34, name: 'Bitslash', category: 'OTHER', kind: 'screen', param: SpotId.S_DIAG2, cell: 5, angle: 0, desc: '-45 deg stepped bit-slash screen' },
  { id: 35, name: 'Variable Hatch', category: 'PATTERN', kind: 'screen', param: SpotId.S_HATCH, cell: 8, angle: 0, desc: 'Woodcut cross-hatching (single to double hatch)' },
  { id: 36, name: 'Grid Modulation', category: 'MODULATION', kind: 'screen', param: SpotId.S_GRID, cell: 7, angle: 0, desc: 'Expanding orthogonal wireframe mesh screen' },
  { id: 37, name: 'Cyber', category: 'OTHER', kind: 'screen', param: SpotId.S_CYBER, cell: 8, angle: 0, desc: 'Octagonal tech-cell matrix with corner nodes' },
  { id: 38, name: 'Cross Square', category: 'PATTERN', kind: 'screen', param: SpotId.S_CROSS, cell: 7, angle: 0, desc: 'Expanding plus-cross clusters' },
  { id: 39, name: 'Diamond', category: 'OTHER', kind: 'screen', param: SpotId.S_DIAMOND, cell: 8, angle: 0, desc: 'Manhattan-distance diamond clusters' },
  { id: 40, name: 'Star', category: 'OTHER', kind: 'screen', param: SpotId.S_STAR, cell: 9, angle: 0, desc: 'Concave 4-pointed astroid star clusters' },
  { id: 41, name: 'Bytewav', category: 'OTHER', kind: 'screen', param: SpotId.S_WAVE, cell: 8, angle: 0, desc: 'FM sine-wave line modulation' },
  { id: 42, name: 'Z-Modulation', category: 'MODULATION', kind: 'screen', param: SpotId.S_ZIGZAG, cell: 8, angle: 0, desc: 'Chevron herringbone zig-zag screen' },
  { id: 43, name: 'Circuit Modulation', category: 'MODULATION', kind: 'screen', param: SpotId.S_CIRCUIT, cell: 10, angle: 0, desc: 'PCB concentric tracks and solder pads' },
  { id: 44, name: 'Vertical Stitch', category: 'OTHER', kind: 'screen', param: SpotId.S_STITCHV, cell: 6, angle: 0, desc: 'Staggered vertical embroidery stitch' },
  { id: 45, name: 'Horizontal Stitch', category: 'OTHER', kind: 'screen', param: SpotId.S_STITCHH, cell: 6, angle: 0, desc: 'Staggered horizontal running stitch' },
  { id: 46, name: 'Clock', category: 'OTHER', kind: 'screen', param: SpotId.S_CLOCK, cell: 10, angle: 0, desc: 'Radial pinwheel sector sweep' },
  { id: 47, name: 'Bi-thread', category: 'OTHER', kind: 'screen', param: SpotId.S_BITHREAD, cell: 7, angle: 0, desc: 'Over-under twill basketweave' },
  { id: 48, name: 'Knit', category: 'PATTERN', kind: 'screen', param: SpotId.S_KNIT, cell: 7, angle: 0, desc: 'V-shaped jersey knit stitch loops' },
];
