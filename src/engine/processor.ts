import { DitherConfig, GrainConfig, VHSConfig, NTSCConfig, ChannelsConfig, LinesConfig } from './types';

// Fast integer hash
function hash32(x: number): number {
  x = ((x >>> 16) ^ x) * 0x45d9f3b;
  x = ((x >>> 16) ^ x) * 0x45d9f3b;
  x = (x >>> 16) ^ x;
  return x >>> 0;
}

function hash3(a: number, b: number, c: number): number {
  return hash32((a * 0x9E3779B1) ^ (b + (0x85ebca6b ^ hash32(c))));
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// 4x4 Bayer Matrix
const BAYER_4X4 = [
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5
];

// 8x8 Bayer Matrix
const BAYER_8X8 = [
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21
];

export function processImage(
  srcCtx: CanvasRenderingContext2D,
  dstCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  dither: DitherConfig,
  grain: GrainConfig,
  vhs: VHSConfig,
  ntsc: NTSCConfig,
  channels: ChannelsConfig,
  lines: LinesConfig
) {
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const src = srcData.data;
  const outData = dstCtx.createImageData(width, height);
  const out = outData.data;

  // Float working buffers for R, G, B, A in [0..1]
  const bufR = new Float32Array(width * height);
  const bufG = new Float32Array(width * height);
  const bufB = new Float32Array(width * height);
  const bufA = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    bufR[i] = src[i * 4 + 0] / 255;
    bufG[i] = src[i * 4 + 1] / 255;
    bufB[i] = src[i * 4 + 2] / 255;
    bufA[i] = src[i * 4 + 3] / 255;
  }

  const frame = Math.floor(timeSec * 24);

  // 1. CHANNELS (RGB Chromatic Aberration)
  if (channels.enabled && Math.abs(channels.amount) > 0.1) {
    const rad = (channels.angle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const sep = channels.amount;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy);

    const tmpR = new Float32Array(bufR);
    const tmpB = new Float32Array(bufB);

    for (let y = 0; y < height; y++) {
      let rJit = 0;
      if (channels.jitter > 0) {
        rJit = ((hash3(y, frame, 91) / 4294967295) * 2 - 1) * channels.jitter;
      }
      for (let x = 0; x < width; x++) {
        let rxOff = cosA * sep + rJit;
        let ryOff = sinA * sep;
        let bxOff = -cosA * sep - rJit;
        let byOff = -sinA * sep;

        if (channels.radial) {
          const vx = (x - cx) / maxR;
          const vy = (y - cy) / maxR;
          rxOff = vx * sep + rJit;
          ryOff = vy * sep;
          bxOff = -vx * sep - rJit;
          byOff = -vy * sep;
        }

        const rx = clamp(Math.round(x - rxOff), 0, width - 1);
        const ry = clamp(Math.round(y - ryOff), 0, height - 1);
        const bx = clamp(Math.round(x - bxOff), 0, width - 1);
        const by = clamp(Math.round(y - byOff), 0, height - 1);

        const idx = y * width + x;
        bufR[idx] = tmpR[ry * width + rx];
        bufB[idx] = tmpB[by * width + bx];
      }
    }
  }

  // 2. DITHER
  const scale = Math.max(1, dither.pixelate ? Math.floor(dither.scale) : 1);
  const spread = dither.spread / 100;
  const bias = ((50 - dither.threshold) / 50) * 0.4;
  const contrast = dither.contrast / 100;
  const bright = dither.brightness / 100;
  const L = Math.max(2, dither.levels);

  // Helper for screen formulas
  const screenFunc = (id: number, u: number, v: number): number => {
    const du = (u - Math.floor(u)) - 0.5;
    const dv = (v - Math.floor(v)) - 0.5;
    switch (id) {
      case 18: // Halftone Dot
      case 19: {
        const d = Math.sqrt(du * du + dv * dv) * 1.414;
        return clamp(d, 0, 1);
      }
      case 20: { // Elliptical
        return clamp(Math.sqrt(du * du * 2 + dv * dv * 0.7) * 1.3, 0, 1);
      }
      case 21: // Horizontal Line
        return clamp(Math.abs(dv) * 2, 0, 1);
      case 24: // Vertical Line
        return clamp(Math.abs(du) * 2, 0, 1);
      case 25: { // Diagonal
        const t = (u + v) - Math.floor(u + v);
        return clamp(Math.abs(t - 0.5) * 2, 0, 1);
      }
      case 27: // Crosshatch
        return clamp(Math.min(Math.abs(du), Math.abs(dv)) * 2.2, 0, 1);
      case 28: // Square
        return clamp(Math.max(Math.abs(du), Math.abs(dv)) * 2, 0, 1);
      case 29: // Diamond
        return clamp(Math.abs(du) + Math.abs(dv), 0, 1);
      case 31: // Cyber
        return clamp(Math.max(Math.abs(du) + Math.abs(dv), Math.max(Math.abs(du), Math.abs(dv)) * 1.3), 0, 1);
      default:
        return 0.5;
    }
  };

  const isDiffusion = dither.algo <= 9;
  if (!isDiffusion) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        let r = clamp((bufR[idx] - 0.5) * contrast + 0.5 + bright, 0, 1);
        let g = clamp((bufG[idx] - 0.5) * contrast + 0.5 + bright, 0, 1);
        let b = clamp((bufB[idx] - 0.5) * contrast + 0.5 + bright, 0, 1);

        let thresh = 0.5;
        const bx = Math.floor(x / scale);
        const by = Math.floor(y / scale);

        if (dither.algo >= 10 && dither.algo <= 12) {
          // Bayer 4x4
          thresh = (BAYER_4X4[(by % 4) * 4 + (bx % 4)] + 0.5) / 16;
        } else if (dither.algo >= 13 && dither.algo <= 14) {
          // Bayer 8x8
          thresh = (BAYER_8X8[(by % 8) * 8 + (bx % 8)] + 0.5) / 64;
        } else if (dither.algo === 15) {
          // Blue noise approximation
          const q = bx * 0.754877 + by * 0.56984;
          thresh = q - Math.floor(q);
        } else if (dither.algo === 16) {
          // IGN
          let f = 0.06711056 * bx + 0.00583715 * by;
          f = f - Math.floor(f);
          f *= 52.9829189;
          thresh = f - Math.floor(f);
        } else if (dither.algo === 17) {
          // White noise
          thresh = (hash3(bx, by, dither.seed + (dither.animate ? frame : 0)) / 4294967295);
        } else if (dither.algo >= 18) {
          // Continuous halftone screens
          const pitch = Math.max(2, 6 * (dither.patternScale / 100));
          const rad = (dither.patternAngle * Math.PI) / 180;
          const u = (x * Math.cos(rad) + y * Math.sin(rad)) / pitch;
          const v = (-x * Math.sin(rad) + y * Math.cos(rad)) / pitch;
          thresh = screenFunc(dither.algo, u, v);
        }

        thresh = clamp(0.5 + (thresh - 0.5) * spread, 0.001, 0.999);

        // Quantize
        if (dither.mode === 1) {
          // Monochrome
          const luma = clamp(0.299 * r + 0.587 * g + 0.114 * b + bias, 0, 1);
          const q = Math.floor(luma * (L - 1) + thresh) / (L - 1);
          bufR[idx] = bufG[idx] = bufB[idx] = q;
        } else {
          // RGB
          const qr = Math.floor(clamp(r + bias, 0, 1) * (L - 1) + thresh) / (L - 1);
          const qg = Math.floor(clamp(g + bias, 0, 1) * (L - 1) + thresh) / (L - 1);
          const qb = Math.floor(clamp(b + bias, 0, 1) * (L - 1) + thresh) / (L - 1);
          bufR[idx] = qr;
          bufG[idx] = qg;
          bufB[idx] = qb;
        }
      }
    }
  } else {
    // Fast Error Diffusion (Floyd-Steinberg / Atkinson)
    const errR = new Float32Array(bufR);
    const errG = new Float32Array(bufG);
    const errB = new Float32Array(bufB);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const curR = clamp((errR[idx] - 0.5) * contrast + 0.5 + bright + bias, 0, 1);
        const curG = clamp((errG[idx] - 0.5) * contrast + 0.5 + bright + bias, 0, 1);
        const curB = clamp((errB[idx] - 0.5) * contrast + 0.5 + bright + bias, 0, 1);

        const newR = Math.floor(curR * (L - 1) + 0.5) / (L - 1);
        const newG = Math.floor(curG * (L - 1) + 0.5) / (L - 1);
        const newB = Math.floor(curB * (L - 1) + 0.5) / (L - 1);

        bufR[idx] = newR;
        bufG[idx] = newG;
        bufB[idx] = newB;

        const diffR = (curR - newR) * spread;
        const diffG = (curG - newG) * spread;
        const diffB = (curB - newB) * spread;

        // Floyd-Steinberg distribution (7/16, 3/16, 5/16, 1/16)
        if (x + 1 < width) {
          errR[idx + 1] += diffR * (7 / 16);
          errG[idx + 1] += diffG * (7 / 16);
          errB[idx + 1] += diffB * (7 / 16);
        }
        if (y + 1 < height) {
          if (x > 0) {
            errR[idx + width - 1] += diffR * (3 / 16);
            errG[idx + width - 1] += diffG * (3 / 16);
            errB[idx + width - 1] += diffB * (3 / 16);
          }
          errR[idx + width] += diffR * (5 / 16);
          errG[idx + width] += diffG * (5 / 16);
          errB[idx + width] += diffB * (5 / 16);
          if (x + 1 < width) {
            errR[idx + width + 1] += diffR * (1 / 16);
            errG[idx + width + 1] += diffG * (1 / 16);
            errB[idx + width + 1] += diffB * (1 / 16);
          }
        }
      }
    }
  }

  // 3. FILM GRAIN
  if (grain.enabled && grain.amount > 0) {
    const grainAmt = (grain.amount / 100) * 0.45;
    const sizeScale = grain.sizeMm / 16.0;
    const animSeed = grain.seed + (grain.autoAnim ? frame * Math.round(grain.speed / 20) : 0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const luma = 0.299 * bufR[idx] + 0.587 * bufG[idx] + 0.114 * bufB[idx];

        // Film toe / shoulder curve (peak in midtones)
        let response = Math.sin(luma * Math.PI);
        if (luma < 0.3) response *= grain.shadows / 100;
        else if (luma > 0.7) response *= grain.highlights / 100;
        else response *= grain.midtones / 100;

        const gx = Math.floor(x / sizeScale);
        const gy = Math.floor(y / sizeScale);

        if (grain.colorMode) {
          // Color grain (RGB dye clouds)
          const gR = ((hash3(gx, gy, animSeed + 1) / 4294967295) * 2 - 1) * grainAmt * response;
          const gG = ((hash3(gx, gy, animSeed + 2) / 4294967295) * 2 - 1) * grainAmt * response;
          const gB = ((hash3(gx, gy, animSeed + 3) / 4294967295) * 2 - 1) * grainAmt * response;
          bufR[idx] = clamp(bufR[idx] + gR, 0, 1);
          bufG[idx] = clamp(bufG[idx] + gG, 0, 1);
          bufB[idx] = clamp(bufB[idx] + gB, 0, 1);
        } else {
          // Mono grain (Silver halide)
          const gV = ((hash3(gx, gy, animSeed) / 4294967295) * 2 - 1) * grainAmt * response;
          bufR[idx] = clamp(bufR[idx] + gV, 0, 1);
          bufG[idx] = clamp(bufG[idx] + gV, 0, 1);
          bufB[idx] = clamp(bufB[idx] + gV, 0, 1);
        }
      }
    }
  }

  // 4. VHS & NTSC ANALOG
  if (vhs.enabled || ntsc.enabled) {
    const tearY = (frame * 3) % height;
    const tearH = Math.max(6, Math.floor(height * 0.08));

    for (let y = 0; y < height; y++) {
      let rowShift = 0;
      if (vhs.enabled) {
        // Tracking wobble & head switch
        const wobble = Math.sin(y * 0.08 + frame * 0.2) * (vhs.trackAmount * 0.1);
        const isTear = Math.abs(y - tearY) < tearH;
        const tearShift = isTear ? ((hash3(y, frame, 7) / 4294967295) * 2 - 1) * vhs.headSwitch * 0.3 : 0;
        const jitter = ((hash3(y, frame, 19) / 4294967295) * 2 - 1) * (vhs.jitter * 0.1);
        rowShift = wobble + tearShift + jitter;
      }

      // CRT Scanlines
      const scanPeriod = vhs.enabled ? Math.max(2, vhs.scanPitch) : Math.max(2, ntsc.scanlines > 0 ? 3 : 1);
      const scanline = 1 - (Math.sin((y / scanPeriod) * Math.PI * 2) * 0.5 + 0.5) * (vhs.scanlines / 200 + ntsc.scanlines / 200);

      for (let x = 0; x < width; x++) {
        const sx = clamp(Math.round(x - rowShift), 0, width - 1);
        const idx = y * width + x;
        const sidx = y * width + sx;

        let r = bufR[sidx] * scanline;
        let g = bufG[sidx] * scanline;
        let b = bufB[sidx] * scanline;

        // Static snow
        if (vhs.enabled && vhs.staticAmount > 0) {
          if (hash3(x, y, frame) % 100 < vhs.staticAmount * 0.15) {
            const snow = (hash3(x, y, frame + 5) / 4294967295);
            r = lerp(r, snow, 0.8);
            g = lerp(g, snow, 0.8);
            b = lerp(b, snow, 0.8);
          }
        }

        // NTSC Dot Crawl
        if (ntsc.enabled && ntsc.dotCrawl > 0) {
          const phase = ((x + ((y + frame) % 2) * 2) % 4) * 0.5;
          const crawl = (phase - 0.5) * (ntsc.dotCrawl / 100) * 0.25;
          r = clamp(r + crawl, 0, 1);
          b = clamp(b - crawl, 0, 1);
        }

        bufR[idx] = r;
        bufG[idx] = g;
        bufB[idx] = b;
      }
    }
  }

  // 5. WRITE BACK TO CANVAS
  for (let i = 0; i < width * height; i++) {
    out[i * 4 + 0] = Math.round(bufR[i] * 255);
    out[i * 4 + 1] = Math.round(bufG[i] * 255);
    out[i * 4 + 2] = Math.round(bufB[i] * 255);
    out[i * 4 + 3] = Math.round(bufA[i] * 255);
  }

  dstCtx.putImageData(outData, 0, 0);

  // 6. LINES & STRANDS (Overlay via 2D canvas drawing)
  if (lines.enabled && lines.amount > 0) {
    dstCtx.save();
    dstCtx.strokeStyle = lines.color;
    dstCtx.lineWidth = lines.width;
    dstCtx.globalAlpha = (lines.opacity / 100) * 0.85;
    dstCtx.lineCap = 'round';

    const strandCount = Math.min(2000, lines.amount);
    const timeAnim = lines.autoAnim ? timeSec * (lines.speed / 100) : 0;

    // Edge candidates extraction if objectMode
    const edgePoints: { x: number; y: number; nx: number; ny: number }[] = [];
    if (lines.objectMode) {
      const step = 4;
      for (let y = 4; y < height - 4; y += step) {
        for (let x = 4; x < width - 4; x += step) {
          const idx = y * width + x;
          const lumaC = 0.299 * bufR[idx] + 0.587 * bufG[idx] + 0.114 * bufB[idx];
          const lumaR = 0.299 * bufR[idx + 1] + 0.587 * bufG[idx + 1] + 0.114 * bufB[idx + 1];
          const lumaD = 0.299 * bufR[idx + width] + 0.587 * bufG[idx + width] + 0.114 * bufB[idx + width];
          const gx = lumaR - lumaC;
          const gy = lumaD - lumaC;
          const mag = Math.hypot(gx, gy);
          if (mag > lines.edgeThreshold / 200) {
            edgePoints.push({ x, y, nx: gx / (mag + 1e-4), ny: gy / (mag + 1e-4) });
          }
        }
      }
    }

    for (let i = 0; i < strandCount; i++) {
      let sx = 0, sy = 0, angle = 0;
      if (lines.objectMode && edgePoints.length > 0) {
        const ep = edgePoints[hash32(i * 17) % edgePoints.length];
        sx = ep.x;
        sy = ep.y;
        angle = lines.edgeDirection === 0 ? Math.atan2(-ep.nx, ep.ny) : Math.atan2(ep.ny, ep.nx);
      } else {
        sx = (hash32(i * 31) / 4294967295) * width;
        sy = (hash32(i * 47) / 4294967295) * height;
        angle = (hash32(i * 59) / 4294967295) * Math.PI * 2;
      }

      const sway = Math.sin(timeAnim * 3 + i) * (lines.curvature / 10);
      const strandLen = lines.length;

      dstCtx.beginPath();
      dstCtx.moveTo(sx, sy);
      const cpX = sx + Math.cos(angle + sway) * (strandLen * 0.5);
      const cpY = sy + Math.sin(angle + sway) * (strandLen * 0.5);
      const endX = sx + Math.cos(angle + sway * 1.5) * strandLen;
      const endY = sy + Math.sin(angle + sway * 1.5) * strandLen;
      dstCtx.quadraticCurveTo(cpX, cpY, endX, endY);
      dstCtx.stroke();
    }
    dstCtx.restore();
  }
}
