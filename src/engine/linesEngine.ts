// ============================================================================
// YMDithers LINES - Web Preview Port of core/lines.cpp
//   * [x] Object Checkbox (lineObjectMode):
//       - When checked (ON): Separable 3x3 Gaussian pre-filter, Sobel gradient,
//         Canny Non-Maximum Suppression (NMS), and connected contour chain tracing.
//         Lines adhere strictly to the object contours with ZERO gap/offset.
//       - When unchecked (OFF): Standard procedural strokes across the layer.
//   * [x] Hand Made Lines Checkbox (lineHandMade) + Curve control (lineCurve 0..100).
//   * [x] Duplicate Lines Checkbox (lineDuplicate, lineDuplicateCount, lineDuplicateOffset).
//   * Deterministic seed hashing matching core/lines.cpp.
// ============================================================================

import { DitherSettings } from '../types/dither';

interface ContourNode {
  x: number;
  y: number;
  nx: number;
  ny: number;
  tx: number;
  ty: number;
  arcLen: number;
}

interface ContourChain {
  nodes: ContourNode[];
  totalLength: number;
}

function clamp(v: number, lo: number, hi: number): number {
  if (Number.isNaN(v)) return lo;
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hashU32(x: number): number {
  let v = x >>> 0;
  v = (v ^ (v >>> 16)) >>> 0;
  v = Math.imul(v, 0x7feb352d) >>> 0;
  v = (v ^ (v >>> 15)) >>> 0;
  v = Math.imul(v, 0x846ca68b) >>> 0;
  v = (v ^ (v >>> 16)) >>> 0;
  return v >>> 0;
}

function hash2(a: number, b: number): number {
  return hashU32((Math.imul(a >>> 0, 0x9e3779b1) + hashU32((b ^ 0x85ebca6b) >>> 0)) >>> 0);
}

function hash3(a: number, b: number, c: number): number {
  const hc = hashU32(((c >>> 0) + 0xc2b2ae35) >>> 0);
  const hb = hashU32(((b >>> 0) + ((0x85ebca6b ^ hc) >>> 0)) >>> 0);
  return hashU32((Math.imul(a >>> 0, 0x9e3779b1) ^ hb) >>> 0);
}

function u01(h: number): number {
  return ((h >>> 8) & 0x00ffffff) / 16777216.0;
}

function extractObjectContours(
  srcData: ImageData,
  threshold: number,
  sensitivity = 75,
  maxContours = 2048
): ContourChain[] {
  const contours: ContourChain[] = [];
  const W = srcData.width;
  const H = srcData.height;
  if (W < 6 || H < 6) return contours;

  const data = srcData.data;
  const luma = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const idx = i * 4;
    luma[i] = (0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]) / 255.0;
  }

  // Separable 3x3 Gaussian smoothing
  const smooth = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const s =
        4.0 * luma[y * W + x] +
        2.0 * (luma[y * W + (x - 1)] + luma[y * W + (x + 1)] + luma[(y - 1) * W + x] + luma[(y + 1) * W + x]) +
        (luma[(y - 1) * W + (x - 1)] + luma[(y - 1) * W + (x + 1)] + luma[(y + 1) * W + (x - 1)] + luma[(y + 1) * W + (x + 1)]);
      smooth[y * W + x] = s * (1.0 / 16.0);
    }
  }

  // Sobel gradients & magnitudes
  const gxBuf = new Float32Array(W * H);
  const gyBuf = new Float32Array(W * H);
  const magBuf = new Float32Array(W * H);
  const gain = Math.max(0.4, sensitivity / 45.0);

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const tl = smooth[(y - 1) * W + (x - 1)];
      const t = smooth[(y - 1) * W + x];
      const tr = smooth[(y - 1) * W + (x + 1)];
      const l = smooth[y * W + (x - 1)];
      const r = smooth[y * W + (x + 1)];
      const bl = smooth[(y + 1) * W + (x - 1)];
      const b = smooth[(y + 1) * W + x];
      const br = smooth[(y + 1) * W + (x + 1)];

      const gx = tr + 2.0 * r + br - (tl + 2.0 * l + bl);
      const gy = bl + 2.0 * b + br - (tl + 2.0 * t + tr);
      const m = Math.hypot(gx, gy) * gain;

      const idx = y * W + x;
      gxBuf[idx] = gx;
      gyBuf[idx] = gy;
      magBuf[idx] = m;
    }
  }

  // Non-Maximum Suppression (NMS)
  const nmsBuf = new Float32Array(W * H);
  const tHigh = clamp(threshold / 100.0, 0.03, 0.85);
  const tLow = tHigh * 0.4;

  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      const idx = y * W + x;
      const m = magBuf[idx];
      if (m < tLow) continue;

      const gx = gxBuf[idx];
      const gy = gyBuf[idx];
      const absGx = Math.abs(gx);
      const absGy = Math.abs(gy);

      let n0 = 0;
      let n1 = 0;
      if (absGx > absGy * 2.4142) {
        n0 = magBuf[idx - 1];
        n1 = magBuf[idx + 1];
      } else if (absGy > absGx * 2.4142) {
        n0 = magBuf[idx - W];
        n1 = magBuf[idx + W];
      } else if ((gx > 0 && gy > 0) || (gx < 0 && gy < 0)) {
        n0 = magBuf[idx - W - 1];
        n1 = magBuf[idx + W + 1];
      } else {
        n0 = magBuf[idx - W + 1];
        n1 = magBuf[idx + W - 1];
      }

      if (m >= n0 && m >= n1) {
        nmsBuf[idx] = m;
      }
    }
  }

  // Connected contour tracing (Hysteresis linking)
  const visited = new Uint8Array(W * H);
  const dx8 = [1, 1, 0, -1, -1, -1, 0, 1];
  const dy8 = [0, 1, 1, 1, 0, -1, -1, -1];

  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      const startIdx = y * W + x;
      if (visited[startIdx] || nmsBuf[startIdx] < tHigh) continue;

      const nodes: ContourNode[] = [];
      let cx = x;
      let cy = y;
      visited[startIdx] = 1;
      let cumLen = 0;
      let prevX = cx;
      let prevY = cy;

      while (true) {
        const curIdx = cy * W + cx;
        const gx = gxBuf[curIdx];
        const gy = gyBuf[curIdx];
        const invL = 1.0 / Math.max(1e-5, Math.hypot(gx, gy));
        const nx = gx * invL;
        const ny = gy * invL;
        const tx = -ny;
        const ty = nx;

        if (nodes.length > 0) {
          cumLen += Math.hypot(cx - prevX, cy - prevY);
          prevX = cx;
          prevY = cy;
        }

        nodes.push({ x: cx, y: cy, nx, ny, tx, ty, arcLen: cumLen });
        if (nodes.length > 4000) break;

        let nextX = -1;
        let nextY = -1;
        let bestMag = tLow;

        for (let k = 0; k < 8; k++) {
          const nxPos = cx + dx8[k];
          const nyPos = cy + dy8[k];
          if (nxPos < 1 || nxPos >= W - 1 || nyPos < 1 || nyPos >= H - 1) continue;
          const nIdx = nyPos * W + nxPos;
          if (!visited[nIdx] && nmsBuf[nIdx] > bestMag) {
            bestMag = nmsBuf[nIdx];
            nextX = nxPos;
            nextY = nyPos;
          }
        }

        if (nextX === -1) break;
        cx = nextX;
        cy = nextY;
        visited[cy * W + cx] = 1;
      }

      if (nodes.length >= 8 && cumLen >= 6.0) {
        contours.push({ nodes, totalLength: cumLen });
        if (contours.length >= maxContours) return contours;
      }
    }
  }

  return contours;
}

function evaluateContour(chain: ContourChain, s: number): ContourNode {
  const nodes = chain.nodes;
  if (nodes.length === 0) return { x: 0, y: 0, nx: 0, ny: 0, tx: 0, ty: 0, arcLen: 0 };
  if (s <= 0 || nodes.length === 1) return nodes[0];
  if (s >= chain.totalLength) return nodes[nodes.length - 1];

  let low = 0;
  let high = nodes.length - 1;
  while (low + 1 < high) {
    const mid = (low + high) >> 1;
    if (nodes[mid].arcLen <= s) low = mid;
    else high = mid;
  }

  const n0 = nodes[low];
  const n1 = nodes[high];
  const segLen = Math.max(1e-4, n1.arcLen - n0.arcLen);
  const t = clamp((s - n0.arcLen) / segLen, 0, 1);

  return {
    x: lerp(n0.x, n1.x, t),
    y: lerp(n0.y, n1.y, t),
    nx: lerp(n0.nx, n1.nx, t),
    ny: lerp(n0.ny, n1.ny, t),
    tx: lerp(n0.tx, n1.tx, t),
    ty: lerp(n0.ty, n1.ty, t),
    arcLen: s,
  };
}

export function renderLinesOverlay(
  ctx: CanvasRenderingContext2D,
  srcData: ImageData,
  settings: DitherSettings
): void {
  if (!settings.enableLines || settings.linesAmount <= 0 || settings.lineOpacity <= 0) return;

  const width = srcData.width;
  const height = srcData.height;

  const count = Math.max(1, Math.min(12000, Math.floor(settings.linesAmount)));
  const seed = hashU32((1 * 19937 + 0x51a8d) >>> 0);

  const baseLen = Math.max(4.0, settings.lineLength);
  const lenRnd = clamp(settings.lineLengthRand / 100.0, 0, 1);
  const baseThick = clamp(settings.lineWidth, 0.2, 12.0);
  const masterAlpha = clamp(settings.lineOpacity / 100.0, 0, 1);
  const curveAmt = settings.lineHandMade ? clamp(settings.lineCurve / 100.0, 0, 1) : 0;
  const strokeColor = settings.lineColor || '#ffffff';

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = strokeColor;

  if (settings.lineObjectMode) {
    const contours = extractObjectContours(srcData, settings.lineEdgeThreshold, 75, 2048);
    if (contours.length > 0) {
      const cumLengths: number[] = [];
      let totalSystemLen = 0;
      for (const ch of contours) {
        totalSystemLen += ch.totalLength;
        cumLengths.push(totalSystemLen);
      }

      for (let i = 0; i < count; i++) {
        const h = hash3(seed, i, 0);
        const rnd = (sub: number) => u01(hash2(h, sub));

        const rPick = rnd(1) * totalSystemLen;
        let lo = 0;
        let hi = cumLengths.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cumLengths[mid] < rPick) lo = mid + 1;
          else hi = mid;
        }
        const chain = contours[lo];
        if (chain.totalLength < 3.0) continue;

        let strandL = baseLen * (1.0 + (rnd(2) * 2.0 - 1.0) * lenRnd);
        strandL = Math.max(4.0, Math.min(strandL, chain.totalLength * 0.95));
        const strandThick = clamp(baseThick * (1.0 + (rnd(3) * 2.0 - 1.0) * 0.3), 0.2, 15.0);

        const span = Math.max(1.0, chain.totalLength - strandL);
        const s0 = rnd(4) * span;
        const alpha = masterAlpha * (1.0 - rnd(9) * 0.25);
        const wobblePhase = (rnd(12) - 0.5) * 1.2;

        const drawContourLine = (normalOffset: number, lenScale: number, widthScale: number, alphaScale: number) => {
          const effLen = Math.max(2.0, strandL * lenScale);
          const segCount = Math.max(3, Math.min(16, Math.ceil(effLen / 4.0)));
          const stepS = effLen / segCount;

          ctx.lineWidth = Math.max(0.2, strandThick * widthScale);
          ctx.globalAlpha = clamp(alpha * alphaScale, 0, 1);
          ctx.beginPath();

          for (let s = 0; s <= segCount; s++) {
            const curS = s0 + s * stepS;
            const pt = evaluateContour(chain, curS);

            let handWobble = 0;
            if (settings.lineHandMade && curveAmt > 0.001) {
              const frac = s / segCount;
              const env = Math.sin(frac * Math.PI);
              const sinCurve = env * Math.cos(wobblePhase) * curveAmt * 2.4;
              const smallNoise = env * (rnd(20 + s) * 2.0 - 1.0) * curveAmt * 0.7;
              handWobble = sinCurve + smallNoise;
            }

            const totalNormOffset = normalOffset + handWobble;
            const px = pt.x + pt.nx * totalNormOffset;
            const py = pt.y + pt.ny * totalNormOffset;

            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        };

        // Primary line strictly on contour (0.0 gap)
        drawContourLine(0.0, 1.0, 1.0, 1.0);

        if (settings.lineDuplicate) {
          const dupN = Math.max(1, Math.min(4, Math.floor(settings.lineDuplicateCount || 1)));
          const dupSpacing = settings.lineDuplicateOffset || 2.5;
          for (let d = 1; d <= dupN; d++) {
            drawContourLine(d * dupSpacing, 0.9, 0.8, 0.75);
          }
        }
      }
    }
  } else {
    // OBJECT OFF -> Standard Procedural Strokes
    for (let i = 0; i < count; i++) {
      const h = hash3(seed, i, 0);
      const rnd = (sub: number) => u01(hash2(h, sub));

      const rx = rnd(1) * width;
      const ry = rnd(2) * height;
      const dirAngle = (rnd(3) * 2.0 - 1.0) * Math.PI;
      const strandL = Math.max(4.0, baseLen * (1.0 + (rnd(4) * 2.0 - 1.0) * lenRnd));
      const strandThick = clamp(baseThick * (1.0 + (rnd(5) * 2.0 - 1.0) * 0.3), 0.2, 15.0);
      const alpha = masterAlpha * (1.0 - rnd(9) * 0.25);

      const drawProceduralLine = (sideOffset: number, lenScale: number, widthScale: number, alphaScale: number) => {
        const effLen = Math.max(2.0, strandL * lenScale);
        const segCount = Math.max(3, Math.min(12, Math.ceil(effLen / 8.0)));
        const segLen = effLen / segCount;
        let px = rx - Math.sin(dirAngle) * sideOffset;
        let py = ry + Math.cos(dirAngle) * sideOffset;
        let curAngle = dirAngle;

        ctx.lineWidth = Math.max(0.2, strandThick * widthScale);
        ctx.globalAlpha = clamp(alpha * alphaScale, 0, 1);
        ctx.beginPath();
        ctx.moveTo(px, py);

        for (let s = 0; s < segCount; s++) {
          const turn = (rnd(15 + s) * 2.0 - 1.0) * curveAmt * 0.35;
          curAngle += turn;
          px += Math.cos(curAngle) * segLen;
          py += Math.sin(curAngle) * segLen;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      };

      drawProceduralLine(0.0, 1.0, 1.0, 1.0);
      if (settings.lineDuplicate) {
        const dupN = Math.max(1, Math.min(4, Math.floor(settings.lineDuplicateCount || 1)));
        const dupSpacing = settings.lineDuplicateOffset || 2.5;
        for (let d = 1; d <= dupN; d++) {
          drawProceduralLine(d * dupSpacing, 0.9, 0.8, 0.75);
        }
      }
    }
  }

  ctx.restore();
}
