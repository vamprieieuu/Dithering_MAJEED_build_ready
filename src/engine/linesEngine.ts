import { LinesParams } from '../types';
import { hexToRgb, luma709 } from './paletteUtils';

export interface ContourNode {
  x: number;
  y: number;
  nx: number; // unit normal (gradient direction)
  ny: number;
  tx: number; // unit tangent (ridge direction)
  ty: number;
  arcLen: number; // cumulative arc length
}

export interface ContourChain {
  nodes: ContourNode[];
  totalLength: number;
  isClosed: boolean;
}

// ---------------------------------------------------------------------------
// 1. Canny-Style NMS + Connected Contour Chain Extractor (with subpixel ridges)
// ---------------------------------------------------------------------------
export function extractObjectContours(
  srcData: ImageData,
  edgeThreshold: number = 25,
  edgeSensitivity: number = 75,
  maxContours: number = 2048
): ContourChain[] {
  const W = srcData.width;
  const H = srcData.height;
  const src = srcData.data;
  const contours: ContourChain[] = [];

  if (W < 6 || H < 6) return contours;
  const totalPixels = W * H;

  // A. Luminance + Alpha extraction
  const luma = new Float32Array(totalPixels);
  const alpha = new Float32Array(totalPixels);
  for (let y = 0; y < H; ++y) {
    for (let x = 0; x < W; ++x) {
      const idx = (y * W + x) * 4;
      const a = (src[idx + 3] ?? 255) / 255;
      const r = src[idx] / 255;
      const g = src[idx + 1] / 255;
      const b = src[idx + 2] / 255;
      const pIdx = y * W + x;
      alpha[pIdx] = a;
      luma[pIdx] = (0.2126 * r + 0.7152 * g + 0.0722 * b) * a;
    }
  }

  // B. 3x3 Gaussian smoothing
  const smooth = new Float32Array(totalPixels);
  for (let y = 0; y < H; ++y) {
    const ym = Math.max(0, y - 1);
    const yp = Math.min(H - 1, y + 1);
    for (let x = 0; x < W; ++x) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(W - 1, x + 1);
      const s =
        4 * luma[y * W + x] +
        2 * (luma[y * W + xm] + luma[y * W + xp] + luma[ym * W + x] + luma[yp * W + x]) +
        1 * (luma[ym * W + xm] + luma[ym * W + xp] + luma[yp * W + xm] + luma[yp * W + xp]);
      smooth[y * W + x] = s * (1 / 16);
    }
  }

  // C. Sobel Gradients & Magnitudes
  const gxBuf = new Float32Array(totalPixels);
  const gyBuf = new Float32Array(totalPixels);
  const magBuf = new Float32Array(totalPixels);
  const gain = Math.max(0.3, edgeSensitivity / 35.0);
  let maxMag = 0;

  for (let y = 1; y < H - 1; ++y) {
    for (let x = 1; x < W - 1; ++x) {
      const tl = smooth[(y - 1) * W + (x - 1)];
      const t = smooth[(y - 1) * W + x];
      const tr = smooth[(y - 1) * W + (x + 1)];
      const l = smooth[y * W + (x - 1)];
      const r = smooth[y * W + (x + 1)];
      const bl = smooth[(y + 1) * W + (x - 1)];
      const b = smooth[(y + 1) * W + x];
      const br = smooth[(y + 1) * W + (x + 1)];

      const gx = (tr + 2 * r + br - (tl + 2 * l + bl)) * gain;
      const gy = (bl + 2 * b + br - (tl + 2 * t + tr)) * gain;
      const m = Math.hypot(gx, gy);

      const idx = y * W + x;
      gxBuf[idx] = gx;
      gyBuf[idx] = gy;
      magBuf[idx] = m;
      if (m > maxMag) maxMag = m;
    }
  }

  if (maxMag < 1e-4) return contours;

  // D. Canny NMS + Hysteresis Chain Tracing
  const runNmsAndTrace = (tHigh: number, tLow: number, minNodes: number, minLen: number): boolean => {
    const nmsBuf = new Float32Array(totalPixels);
    const subDx = new Float32Array(totalPixels);
    const subDy = new Float32Array(totalPixels);

    for (let y = 2; y < H - 2; ++y) {
      for (let x = 2; x < W - 2; ++x) {
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

        if (m >= n0 && m >= n1 - 1e-5) {
          nmsBuf[idx] = m;
          const denom = n0 - 2 * m + n1;
          let delta = 0;
          if (Math.abs(denom) > 1e-5) {
            delta = Math.max(-0.5, Math.min(0.5, (0.5 * (n0 - n1)) / denom));
          }
          const invL = 1 / Math.max(1e-5, Math.hypot(gx, gy));
          subDx[idx] = delta * gx * invL;
          subDy[idx] = delta * gy * invL;
        }
      }
    }

    const visited = new Uint8Array(totalPixels);
    const dx8 = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy8 = [0, 1, 1, 1, 0, -1, -1, -1];

    const traceHalf = (startX: number, startY: number, pts: Array<{ x: number; y: number }>) => {
      let cx = startX;
      let cy = startY;
      while (pts.length < 3000) {
        let nextX = -1;
        let nextY = -1;
        let bestMag = tLow;
        for (let k = 0; k < 8; ++k) {
          const nxPos = cx + dx8[k];
          const nyPos = cy + dy8[k];
          if (nxPos < 1 || nxPos >= W - 1 || nyPos < 1 || nyPos >= H - 1) continue;
          const nIdx = nyPos * W + nxPos;
          if (!visited[nIdx] && nmsBuf[nIdx] >= bestMag) {
            bestMag = nmsBuf[nIdx];
            nextX = nxPos;
            nextY = nyPos;
          }
        }
        if (nextX === -1) {
          // Bridge 1-pixel diagonal gaps
          for (let dy = -2; dy <= 2; ++dy) {
            for (let dx = -2; dx <= 2; ++dx) {
              if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue;
              const nxPos = cx + dx;
              const nyPos = cy + dy;
              if (nxPos < 1 || nxPos >= W - 1 || nyPos < 1 || nyPos >= H - 1) continue;
              const nIdx = nyPos * W + nxPos;
              if (!visited[nIdx] && nmsBuf[nIdx] >= bestMag) {
                bestMag = nmsBuf[nIdx];
                nextX = nxPos;
                nextY = nyPos;
              }
            }
          }
        }
        if (nextX === -1) break;
        cx = nextX;
        cy = nextY;
        visited[cy * W + cx] = 1;
        pts.push({ x: cx, y: cy });
      }
    };

    for (let y = 2; y < H - 2; ++y) {
      for (let x = 2; x < W - 2; ++x) {
        const startIdx = y * W + x;
        if (visited[startIdx] || nmsBuf[startIdx] < tHigh) continue;

        visited[startIdx] = 1;
        const fwd: Array<{ x: number; y: number }> = [];
        const bwd: Array<{ x: number; y: number }> = [];
        traceHalf(x, y, fwd);
        traceHalf(x, y, bwd);

        const ordered: Array<{ x: number; y: number }> = [];
        for (let i = bwd.length - 1; i >= 0; --i) ordered.push(bwd[i]);
        ordered.push({ x, y });
        for (let i = 0; i < fwd.length; ++i) ordered.push(fwd[i]);

        const nodes: ContourNode[] = [];
        let cumLen = 0;
        let prevX = ordered[0].x + subDx[ordered[0].y * W + ordered[0].x];
        let prevY = ordered[0].y + subDy[ordered[0].y * W + ordered[0].x];

        for (let i = 0; i < ordered.length; ++i) {
          const cx = ordered[i].x;
          const cy = ordered[i].y;
          const curIdx = cy * W + cx;
          const gx = gxBuf[curIdx];
          const gy = gyBuf[curIdx];
          const invL = 1 / Math.max(1e-5, Math.hypot(gx, gy));
          const nx = gx * invL;
          const ny = gy * invL;
          const tx = -ny;
          const ty = nx;

          const subX = cx + subDx[curIdx];
          const subY = cy + subDy[curIdx];

          if (i > 0) {
            cumLen += Math.hypot(subX - prevX, subY - prevY);
            prevX = subX;
            prevY = subY;
          }
          nodes.push({ x: subX, y: subY, nx, ny, tx, ty, arcLen: cumLen });
        }

        if (nodes.length >= minNodes && cumLen >= minLen) {
          const isClosed =
            nodes.length > 4 &&
            Math.hypot(nodes[0].x - nodes[nodes.length - 1].x, nodes[0].y - nodes[nodes.length - 1].y) < 4.0;
          contours.push({ nodes, totalLength: cumLen, isClosed });
          if (contours.length >= maxContours) return true;
        }
      }
    }
    return contours.length > 0;
  };

  // Adaptive threshold calculation
  const userNorm = Math.max(0.01, Math.min(1.0, edgeThreshold / 100));
  const effHigh = Math.max(0.015, userNorm * Math.min(1.2, maxMag * 0.45));
  const effLow = effHigh * 0.35;

  let found = runNmsAndTrace(effHigh, effLow, 4, 3.0);
  if (!found || contours.length < 3) {
    const fallHigh = Math.max(0.008, effHigh * 0.4);
    runNmsAndTrace(fallHigh, fallHigh * 0.35, 3, 2.0);
  }
  if (contours.length === 0) {
    const minHigh = Math.max(0.003, maxMag * 0.08);
    runNmsAndTrace(minHigh, minHigh * 0.25, 2, 1.5);
  }

  // Fallback streamline tracer from gradient peaks
  if (contours.length === 0 && maxMag > 1e-4) {
    const peaks: Array<{ m: number; idx: number }> = [];
    for (let y = 2; y < H - 2; y += 2) {
      for (let x = 2; x < W - 2; x += 2) {
        const idx = y * W + x;
        const m = magBuf[idx];
        if (m > maxMag * 0.15) peaks.push({ m, idx });
      }
    }
    peaks.sort((a, b) => b.m - a.m);
    const visited = new Uint8Array(totalPixels);
    const maxSeeds = Math.min(peaks.length, 200);

    for (let i = 0; i < maxSeeds; ++i) {
      const seedIdx = peaks[i].idx;
      if (visited[seedIdx]) continue;
      const curX = seedIdx % W;
      const curY = Math.floor(seedIdx / W);
      const nodes: ContourNode[] = [];
      let cumLen = 0;

      for (const dir of [-1, 1]) {
        let px = curX;
        let py = curY;
        for (let step = 0; step < 60; ++step) {
          const ix = Math.max(1, Math.min(W - 2, Math.round(px)));
          const iy = Math.max(1, Math.min(H - 2, Math.round(py)));
          const cIdx = iy * W + ix;
          visited[cIdx] = 1;

          const gx = gxBuf[cIdx];
          const gy = gyBuf[cIdx];
          const m = Math.hypot(gx, gy);
          if (m < maxMag * 0.05) break;

          const invM = 1 / m;
          const nx = gx * invM;
          const ny = gy * invM;
          const tx = -ny * dir;
          const ty = nx * dir;

          if (step > 0 || dir === 1) {
            if (nodes.length > 0) {
              cumLen += Math.hypot(px - nodes[nodes.length - 1].x, py - nodes[nodes.length - 1].y);
            }
            nodes.push({ x: px, y: py, nx, ny, tx, ty, arcLen: cumLen });
          }

          px += tx * 1.5;
          py += ty * 1.5;
          if (px < 1 || px >= W - 2 || py < 1 || py >= H - 2) break;
        }
      }

      if (nodes.length >= 3 && cumLen > 3.0) {
        contours.push({ nodes, totalLength: cumLen, isClosed: false });
        if (contours.length >= maxContours) break;
      }
    }
  }

  return contours;
}

// ---------------------------------------------------------------------------
// 2. Subpixel Continuous Contour Evaluation
// ---------------------------------------------------------------------------
export function evaluateContour(
  chain: ContourChain,
  s: number
): { x: number; y: number; nx: number; ny: number; tx: number; ty: number } {
  if (chain.nodes.length === 0) return { x: 0, y: 0, nx: 0, ny: 0, tx: 1, ty: 0 };
  if (s <= 0 || chain.nodes.length === 1) {
    const n = chain.nodes[0];
    return { x: n.x, y: n.y, nx: n.nx, ny: n.ny, tx: n.tx, ty: n.ty };
  }
  if (s >= chain.totalLength) {
    const n = chain.nodes[chain.nodes.length - 1];
    return { x: n.x, y: n.y, nx: n.nx, ny: n.ny, tx: n.tx, ty: n.ty };
  }

  let low = 0;
  let high = chain.nodes.length - 1;
  while (low + 1 < high) {
    const mid = (low + high) >> 1;
    if (chain.nodes[mid].arcLen <= s) low = mid;
    else high = mid;
  }

  const n0 = chain.nodes[low];
  const n1 = chain.nodes[high];
  const segLen = Math.max(1e-4, n1.arcLen - n0.arcLen);
  const t = Math.max(0, Math.min(1, (s - n0.arcLen) / segLen));

  return {
    x: n0.x + (n1.x - n0.x) * t,
    y: n0.y + (n1.y - n0.y) * t,
    nx: n0.nx + (n1.nx - n0.nx) * t,
    ny: n0.ny + (n1.ny - n0.ny) * t,
    tx: n0.tx + (n1.tx - n0.tx) * t,
    ty: n0.ty + (n1.ty - n0.ty) * t,
  };
}

// ---------------------------------------------------------------------------
// 3. Main Lines Renderer
// ---------------------------------------------------------------------------
export function renderLines(
  targetCtx: CanvasRenderingContext2D,
  srcData: ImageData,
  params: LinesParams,
  animTime: number = 0
): void {
  // Requirement 1: If Lines is OFF or Amount <= 0, no lines render!
  if (!params.enabled || params.amount <= 0.1 || params.opacity <= 0.1) return;

  const W = srcData.width;
  const H = srcData.height;
  const src = srcData.data;

  const count = Math.max(1, Math.min(10000, Math.floor(params.amount)));
  const masterAlpha = Math.max(0, Math.min(1, params.opacity / 100));
  const baseColor = hexToRgb(params.color);
  const curveAmt = params.handMade ? Math.max(0, Math.min(1, params.curve / 100)) : 0;
  const edgeOffset = params.edgeOffset ?? 0.0;
  const edgeDir = params.edgeDirection ?? 0; // 0: along, 1: perp, 2: random, 3: custom
  const autoAnim = params.autoAnim ?? true;
  const animSpeed = params.animSpeed ?? 100;
  const motRand = Math.max(0, Math.min(1, (params.motionRand ?? 50) / 100));

  targetCtx.save();
  targetCtx.lineCap = 'round';
  targetCtx.lineJoin = 'round';

  // =========================================================================
  // BRANCH A: OBJECT ON -> Real Contour Following (ZERO GAP)
  // =========================================================================
  if (params.objectMode) {
    const contours = extractObjectContours(
      srcData,
      params.edgeThreshold ?? 25,
      params.edgeSensitivity ?? 75,
      2048
    );

    let totalSystemLen = 0;
    const cumLengths: number[] = [];
    for (const ch of contours) {
      totalSystemLen += ch.totalLength;
      cumLengths.push(totalSystemLen);
    }

    if (contours.length > 0 && totalSystemLen > 0.1) {
      const baseLen = Math.max(4.0, params.length);
      const lenRnd = Math.max(0, Math.min(1, (params.lengthRand ?? 40) / 100));
      const baseThick = Math.max(0.2, Math.min(15, params.width));
      const thkRnd = Math.max(0, Math.min(1, (params.widthRand ?? 30) / 100));

      for (let i = 0; i < count; ++i) {
        // Hash for deterministic reproducibility
        const h0 = ((i * 1664525 + 1013904223) ^ (params.seed ?? 1)) >>> 0;
        const rnd = (sub: number) => {
          const val = ((h0 + sub * 22695477) ^ 0x5bf03635) >>> 0;
          return (val & 0xffff) / 65535.0;
        };

        // Proportional contour chain pick
        const rPick = rnd(1) * totalSystemLen;
        let cIdx = 0;
        while (cIdx < cumLengths.length - 1 && cumLengths[cIdx] < rPick) cIdx++;
        const chain = contours[cIdx];
        if (!chain || chain.totalLength < 1.5 || chain.nodes.length === 0) continue;

        const strandL = Math.max(3.0, Math.min(chain.totalLength, baseLen * (1.0 + (rnd(2) * 2 - 1) * lenRnd)));
        const strandThick = Math.max(0.2, Math.min(15, baseThick * (1.0 + (rnd(3) * 2 - 1) * thkRnd)));

        // Arc length start point
        const motScale = 1.0 + (rnd(11) * 2 - 1) * motRand * 0.75;
        const avail = Math.max(0.0, chain.totalLength - strandL);
        let s0 = 0.0;

        if (chain.isClosed) {
          const baseS = rnd(4) * chain.totalLength;
          if (autoAnim) {
            const drift = animTime * 35.0 * motScale * (animSpeed / 100) + rnd(5) * 80.0;
            s0 = (baseS + drift) % chain.totalLength;
            if (s0 < 0) s0 += chain.totalLength;
          } else {
            s0 = baseS;
          }
        } else {
          if (avail > 0.001) {
            const baseS = rnd(4) * avail;
            if (autoAnim) {
              const drift = animTime * 35.0 * motScale * (animSpeed / 100) + rnd(5) * 80.0;
              const cycle = avail * 2.0;
              let t = (baseS + drift) % cycle;
              if (t < 0) t += cycle;
              s0 = t > avail ? cycle - t : t;
            } else {
              s0 = baseS;
            }
          } else {
            s0 = 0.0;
          }
        }

        // Color determination
        let col = { r: baseColor.r, g: baseColor.g, b: baseColor.b };
        if (params.colorMode === 'sampled' || params.colorMode === 1) {
          const pt0 = evaluateContour(chain, s0);
          const sx = Math.max(0, Math.min(W - 1, Math.round(pt0.x - pt0.nx * 1.5)));
          const sy = Math.max(0, Math.min(H - 1, Math.round(pt0.y - pt0.ny * 1.5)));
          const pIdx = (sy * W + sx) * 4;
          col = { r: src[pIdx], g: src[pIdx + 1], b: src[pIdx + 2] };
        } else if (params.colorMode === 'random' || params.colorMode === 2) {
          col = {
            r: Math.floor(rnd(6) * 256),
            g: Math.floor(rnd(7) * 256),
            b: Math.floor(rnd(8) * 256),
          };
        }

        const alpha = masterAlpha * (1.0 - rnd(9) * 0.2);

        // Emit contour line segments
        const emitStroke = (normOffset: number, lenScale: number, widthScale: number, alphaScale: number) => {
          const effLen = Math.max(2.0, strandL * lenScale);
          const segCount = Math.max(3, Math.min(16, Math.ceil(effLen / 4.5)));
          const stepS = effLen / segCount;
          const wobblePhase = (rnd(12) - 0.5) * 1.5;

          targetCtx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha * alphaScale})`;
          targetCtx.lineWidth = strandThick * widthScale;
          targetCtx.beginPath();

          if (edgeDir === 0) {
            // Along Contours (Strict ridge curve tracing)
            for (let s = 0; s <= segCount; ++s) {
              let curS = 0;
              if (chain.isClosed) {
                curS = (s0 + s * stepS) % chain.totalLength;
                if (curS < 0) curS += chain.totalLength;
              } else {
                curS = Math.max(0, Math.min(chain.totalLength, s0 + s * stepS));
              }

              const pt = evaluateContour(chain, curS);
              let handWobble = 0.0;
              if (params.handMade && curveAmt > 0.001) {
                const frac = s / segCount;
                const env = Math.sin(frac * Math.PI);
                const sinCurve = env * Math.cos(wobblePhase + frac * Math.PI * 2) * curveAmt * 2.2;
                const noise = env * (rnd(20 + s) * 2 - 1) * curveAmt * 0.6;
                handWobble = sinCurve + noise;
              }

              const totalOffset = edgeOffset + normOffset + handWobble;
              const px = pt.x + pt.nx * totalOffset;
              const py = pt.y + pt.ny * totalOffset;

              if (s === 0) targetCtx.moveTo(px, py);
              else targetCtx.lineTo(px, py);
            }
          } else {
            // Perpendicular / Random / Custom angle anchored at contour point s0
            const pt0 = evaluateContour(chain, s0);
            let dirAng = 0.0;
            if (edgeDir === 1) dirAng = Math.atan2(pt0.ny, pt0.nx);
            else if (edgeDir === 2) dirAng = rnd(14) * Math.PI * 2;
            else dirAng = (params.angle ?? 0) * (Math.PI / 180);

            let px = pt0.x + pt0.nx * (edgeOffset + normOffset);
            let py = pt0.y + pt0.ny * (edgeOffset + normOffset);
            targetCtx.moveTo(px, py);

            let curAng = dirAng;
            for (let s = 1; s <= segCount; ++s) {
              if (params.handMade && curveAmt > 0.001) {
                curAng += (rnd(20 + s) * 2 - 1) * curveAmt * 0.35;
              }
              px += Math.cos(curAng) * stepS;
              py += Math.sin(curAng) * stepS;
              targetCtx.lineTo(px, py);
            }
          }
          targetCtx.stroke();
        };

        // Primary line (tightly glued to the contour!)
        emitStroke(0, 1.0, 1.0, 1.0);

        // Duplicate companion lines hugging the same contour
        if (params.duplicate) {
          const dupN = Math.max(1, Math.min(4, params.duplicateCount ?? 1));
          const dupSpacing = params.duplicateOffset ?? 2.5;
          const dupLScale = Math.max(0.1, Math.min(2.0, (params.duplicateLength ?? 90) / 100));
          const dupWScale = (params.duplicateWidth ?? 0.8) / Math.max(0.1, params.width);
          const dupAScale = (params.duplicateOpacity ?? 75) / 100;

          for (let d = 1; d <= dupN; ++d) {
            emitStroke(d * dupSpacing, dupLScale, dupWScale, dupAScale);
          }
        }
      }
      targetCtx.restore();
      return;
    }
  }

  // =========================================================================
  // BRANCH B: OBJECT OFF -> Standard Procedural Strokes
  // =========================================================================
  const baseLen = Math.max(4.0, params.length);
  const lenRnd = Math.max(0, Math.min(1, (params.lengthRand ?? 40) / 100));
  const baseThick = Math.max(0.2, Math.min(15, params.width));
  const thkRnd = Math.max(0, Math.min(1, (params.widthRand ?? 30) / 100));
  const baseAngle = ((params.angle ?? 0) * Math.PI) / 180;
  const angleSpread = ((params.angleRand ?? 180) * Math.PI) / 180;

  for (let i = 0; i < count; ++i) {
    const h0 = ((i * 1664525 + 1013904223) ^ (params.seed ?? 1)) >>> 0;
    const rnd = (sub: number) => {
      const val = ((h0 + sub * 22695477) ^ 0x5bf03635) >>> 0;
      return (val & 0xffff) / 65535.0;
    };

    const rx = rnd(1) * W;
    const ry = rnd(2) * H;
    const dirAngle = baseAngle + (rnd(3) * 2 - 1) * angleSpread;
    const strandL = Math.max(4.0, baseLen * (1.0 + (rnd(4) * 2 - 1) * lenRnd));
    const strandThick = Math.max(0.2, Math.min(15, baseThick * (1.0 + (rnd(5) * 2 - 1) * thkRnd)));

    let col = { r: baseColor.r, g: baseColor.g, b: baseColor.b };
    if (params.colorMode === 'sampled' || params.colorMode === 1) {
      const sx = Math.max(0, Math.min(W - 1, Math.round(rx)));
      const sy = Math.max(0, Math.min(H - 1, Math.round(ry)));
      const pIdx = (sy * W + sx) * 4;
      col = { r: src[pIdx], g: src[pIdx + 1], b: src[pIdx + 2] };
    } else if (params.colorMode === 'random' || params.colorMode === 2) {
      col = {
        r: Math.floor(rnd(6) * 256),
        g: Math.floor(rnd(7) * 256),
        b: Math.floor(rnd(8) * 256),
      };
    }

    const alpha = masterAlpha * (1.0 - rnd(9) * 0.25);

    const emitProceduralLine = (sideOffset: number, lenScale: number, widthScale: number, alphaScale: number) => {
      const effLen = Math.max(2.0, strandL * lenScale);
      const segCount = Math.max(3, Math.min(12, Math.ceil(effLen / 8.0)));
      const segLen = effLen / segCount;
      let px = rx - Math.sin(dirAngle) * sideOffset;
      let py = ry + Math.cos(dirAngle) * sideOffset;
      let curAngle = dirAngle;
      const sway = autoAnim
        ? Math.sin(animTime * 2.5 * (animSpeed / 100) + rnd(10) * Math.PI * 2 * motRand) * 4.0
        : 0;

      targetCtx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha * alphaScale})`;
      targetCtx.lineWidth = strandThick * widthScale;
      targetCtx.beginPath();
      targetCtx.moveTo(px, py);

      for (let s = 0; s < segCount; ++s) {
        const turn = (rnd(15 + s) * 2 - 1) * curveAmt * 0.35;
        curAngle += turn;
        px += Math.cos(curAngle + sway * 0.05) * segLen;
        py += Math.sin(curAngle + sway * 0.05) * segLen;
        targetCtx.lineTo(px, py);
      }
      targetCtx.stroke();
    };

    emitProceduralLine(0, 1.0, 1.0, 1.0);
    if (params.duplicate) {
      const dupN = Math.max(1, Math.min(4, params.duplicateCount ?? 1));
      const dupSpacing = params.duplicateOffset ?? 2.5;
      const dupLScale = Math.max(0.1, Math.min(2.0, (params.duplicateLength ?? 90) / 100));
      const dupWScale = (params.duplicateWidth ?? 0.8) / Math.max(0.1, params.width);
      const dupAScale = (params.duplicateOpacity ?? 75) / 100;
      for (let d = 1; d <= dupN; ++d) {
        emitProceduralLine(d * dupSpacing, dupLScale, dupWScale, dupAScale);
      }
    }
  }

  targetCtx.restore();
}
