import { LinesParams } from '../types/dither';
import { hexToRgb } from './ditherEngine';

export interface RenderedLine {
  points: { x: number; y: number }[];
  color: [number, number, number];
  width: number;
  opacity: number;
}

interface ContourNode {
  x: number;
  y: number;
  nx: number; // unit normal (gradient direction)
  ny: number;
  tx: number; // unit tangent (ridge direction)
  ty: number;
  arcLen: number;
}

interface ContourChain {
  nodes: ContourNode[];
  totalLength: number;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// CANNY NMS + HYSTERESIS CONTOUR CHAIN EXTRACTION (from core/lines.cpp)
// ---------------------------------------------------------------------------
function extractObjectContours(
  srcData: ImageData,
  thresholdPct: number,
  sensitivityPct: number,
  maxContours = 2048
): ContourChain[] {
  const W = srcData.width;
  const H = srcData.height;
  const data = srcData.data;
  if (W < 8 || H < 8) return [];

  // A. Luminance extraction
  const luma = new Float32Array(W * H);
  for (let i = 0; i < W * H; ++i) {
    const idx = i * 4;
    luma[i] = 0.2126 * (data[idx] / 255.0) + 0.7152 * (data[idx + 1] / 255.0) + 0.0722 * (data[idx + 2] / 255.0);
  }

  // B. Separable 3x3 Gaussian smoothing to suppress sensor noise & grain
  const smooth = new Float32Array(W * H);
  for (let y = 1; y < H - 1; ++y) {
    const yW = y * W;
    for (let x = 1; x < W - 1; ++x) {
      const s = 4.0 * luma[yW + x]
        + 2.0 * (luma[yW + (x - 1)] + luma[yW + (x + 1)] + luma[(y - 1) * W + x] + luma[(y + 1) * W + x])
        + 1.0 * (luma[(y - 1) * W + (x - 1)] + luma[(y - 1) * W + (x + 1)] + luma[(y + 1) * W + (x - 1)] + luma[(y + 1) * W + (x + 1)]);
      smooth[yW + x] = s * (1.0 / 16.0);
    }
  }

  // C. Sobel Gradients & Magnitudes
  const gxBuf = new Float32Array(W * H);
  const gyBuf = new Float32Array(W * H);
  const magBuf = new Float32Array(W * H);
  const gain = Math.max(0.4, sensitivityPct / 45.0);

  for (let y = 1; y < H - 1; ++y) {
    const yW = y * W;
    for (let x = 1; x < W - 1; ++x) {
      const tl = smooth[(y - 1) * W + (x - 1)], t = smooth[(y - 1) * W + x], tr = smooth[(y - 1) * W + (x + 1)];
      const l  = smooth[yW + (x - 1)],                                        r  = smooth[yW + (x + 1)];
      const bl = smooth[(y + 1) * W + (x - 1)], b = smooth[(y + 1) * W + x], br = smooth[(y + 1) * W + (x + 1)];

      const gx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
      const gy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);
      const m = Math.sqrt(gx * gx + gy * gy) * gain;

      const idx = yW + x;
      gxBuf[idx] = gx;
      gyBuf[idx] = gy;
      magBuf[idx] = m;
    }
  }

  // D. Non-Maximum Suppression (NMS) to thin gradients to 1-pixel crisp ridges
  const nmsBuf = new Float32Array(W * H);
  const tHigh = clamp(thresholdPct / 100.0, 0.03, 0.85);
  const tLow = tHigh * 0.40;

  for (let y = 2; y < H - 2; ++y) {
    const yW = y * W;
    for (let x = 2; x < W - 2; ++x) {
      const idx = yW + x;
      const m = magBuf[idx];
      if (m < tLow) continue;

      const gx = gxBuf[idx];
      const gy = gyBuf[idx];
      const absGx = Math.abs(gx);
      const absGy = Math.abs(gy);

      let n0 = 0.0, n1 = 0.0;
      if (absGx > absGy * 2.4142) {
        // Horizontal normal -> compare East / West
        n0 = magBuf[idx - 1];
        n1 = magBuf[idx + 1];
      } else if (absGy > absGx * 2.4142) {
        // Vertical normal -> compare North / South
        n0 = magBuf[idx - W];
        n1 = magBuf[idx + W];
      } else if ((gx > 0 && gy > 0) || (gx < 0 && gy < 0)) {
        // 45 deg diagonal -> compare NE / SW
        n0 = magBuf[idx - W - 1];
        n1 = magBuf[idx + W + 1];
      } else {
        // 135 deg diagonal -> compare NW / SE
        n0 = magBuf[idx - W + 1];
        n1 = magBuf[idx + W - 1];
      }

      if (m >= n0 && m >= n1) {
        nmsBuf[idx] = m;
      }
    }
  }

  // E. Connected Contour Tracing (Hysteresis Linking)
  const visited = new Uint8Array(W * H);
  const dx8 = [1,  1,  0, -1, -1, -1,  0,  1];
  const dy8 = [0,  1,  1,  1,  0, -1, -1, -1];
  const contours: ContourChain[] = [];

  for (let y = 2; y < H - 2; ++y) {
    const yW = y * W;
    for (let x = 2; x < W - 2; ++x) {
      const startIdx = yW + x;
      if (visited[startIdx] || nmsBuf[startIdx] < tHigh) continue;

      // Start new contour chain
      const chainNodes: ContourNode[] = [];
      let cx = x;
      let cy = y;
      visited[startIdx] = 1;

      let cumLen = 0.0;
      let prevX = cx;
      let prevY = cy;

      while (true) {
        const curIdx = cy * W + cx;
        const gx = gxBuf[curIdx];
        const gy = gyBuf[curIdx];
        const invL = 1.0 / Math.max(1e-5, Math.sqrt(gx * gx + gy * gy));
        const nx = gx * invL;
        const ny = gy * invL;
        const tx = -ny;
        const ty = nx;

        if (chainNodes.length > 0) {
          cumLen += Math.hypot(cx - prevX, cy - prevY);
          prevX = cx;
          prevY = cy;
        }

        chainNodes.push({ x: cx, y: cy, nx, ny, tx, ty, arcLen: cumLen });
        if (chainNodes.length > 3000) break; // guard against runaway loop

        // Search 8-neighbors for strongest unvisited ridge point
        let nextX = -1, nextY = -1;
        let bestMag = tLow;

        for (let k = 0; k < 8; ++k) {
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

      // Filter out tiny noise specks (< 6px length)
      if (chainNodes.length >= 6 && cumLen >= 5.0) {
        contours.push({
          nodes: chainNodes,
          totalLength: cumLen
        });
        if (contours.length >= maxContours) return contours;
      }
    }
  }

  return contours;
}

// Subpixel continuous point evaluation along contour chain
function evaluateContour(
  chain: ContourChain,
  s: number
): { x: number; y: number; nx: number; ny: number; tx: number; ty: number } {
  const nodes = chain.nodes;
  if (nodes.length === 0) return { x: 0, y: 0, nx: 0, ny: 0, tx: 0, ty: 0 };
  if (s <= 0.0 || nodes.length === 1) {
    const n = nodes[0];
    return { x: n.x, y: n.y, nx: n.nx, ny: n.ny, tx: n.tx, ty: n.ty };
  }
  if (s >= chain.totalLength) {
    const n = nodes[nodes.length - 1];
    return { x: n.x, y: n.y, nx: n.nx, ny: n.ny, tx: n.tx, ty: n.ty };
  }

  // Binary search along arc-length
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
  const t = clamp((s - n0.arcLen) / segLen, 0.0, 1.0);

  return {
    x: lerp(n0.x, n1.x, t),
    y: lerp(n0.y, n1.y, t),
    nx: lerp(n0.nx, n1.nx, t),
    ny: lerp(n0.ny, n1.ny, t),
    tx: lerp(n0.tx, n1.tx, t),
    ty: lerp(n0.ty, n1.ty, t),
  };
}

// ---------------------------------------------------------------------------
// MAIN LINES ENGINE: PROCEDURAL & OBJECT CONTOUR FOLLOWING
// ---------------------------------------------------------------------------
export function generateLinesOverlay(
  srcData: ImageData,
  params: LinesParams,
  frameTimeSec = 0
): RenderedLine[] {
  if (!params.enabled || params.amount <= 0 || params.opacity <= 0.1) return [];

  const W = srcData.width;
  const H = srcData.height;
  const data = srcData.data;

  const count = Math.min(5000, Math.floor(params.amount));
  const baseLen = Math.max(3.0, params.length);
  const lenRnd = clamp(params.lengthRand / 100.0, 0.0, 1.0);
  const baseThick = clamp(params.width, 0.2, 12.0);
  const thkRnd = clamp(params.widthRand / 100.0, 0.0, 1.0);
  const masterAlpha = clamp(params.opacity / 100.0, 0.0, 1.0);
  const curveAmt = params.handMade ? clamp(params.curve / 100.0, 0.0, 1.0) : 0.0;

  const lines: RenderedLine[] = [];

  // Parse color
  let baseRgb: [number, number, number] = [1, 1, 1];
  if (params.colorMode === 'white') baseRgb = [1, 1, 1];
  else if (params.colorMode === 'black') baseRgb = [0, 0, 0];
  else if (params.colorMode === 'custom') baseRgb = hexToRgb(params.color);

  // -------------------------------------------------------------------------
  // BRANCH A: OBJECT CHECKBOX IS ON -> Strict Contour Following (ZERO GAP)
  // -------------------------------------------------------------------------
  if (params.objectMode) {
    const contours = extractObjectContours(srcData, params.edgeThreshold, params.edgeSensitivity, 2048);

    if (contours.length > 0) {
      // Build cumulative length table for proportional sampling
      const cumLengths: number[] = [];
      let totalSystemLen = 0.0;
      for (const ch of contours) {
        totalSystemLen += ch.totalLength;
        cumLengths.push(totalSystemLen);
      }

      for (let i = 0; i < count; ++i) {
        // Deterministic random generator per strand
        const r1 = Math.random();
        const r2 = Math.random();
        const r3 = Math.random();
        const r4 = Math.random();

        // Sample contour weighted by chain length
        const targetLen = r1 * totalSystemLen;
        let cIdx = 0;
        let low = 0, high = cumLengths.length - 1;
        while (low <= high) {
          const mid = (low + high) >> 1;
          if (cumLengths[mid] >= targetLen) {
            cIdx = mid;
            high = mid - 1;
          } else {
            low = mid + 1;
          }
        }
        const chain = contours[cIdx];
        if (!chain || chain.totalLength < 3.0) continue;

        // Length & thickness with randomness
        const strandL = Math.max(3.0, Math.min(baseLen * (1.0 + (r2 * 2.0 - 1.0) * lenRnd), chain.totalLength * 0.95));
        const strandThick = clamp(baseThick * (1.0 + (r3 * 2.0 - 1.0) * thkRnd), 0.2, 12.0);

        // Position along contour arc
        let s0 = r4 * Math.max(0.1, chain.totalLength - strandL);
        if (params.motion) {
          const drift = frameTimeSec * (params.motionSpeed / 100.0) * 40.0;
          s0 = (s0 + drift) % Math.max(1.0, chain.totalLength - strandL);
        }

        // Color
        let strandCol: [number, number, number] = [...baseRgb];
        if (params.colorMode === 'sampled') {
          const p = evaluateContour(chain, s0);
          const sx = clamp(Math.floor(p.x), 0, W - 1);
          const sy = clamp(Math.floor(p.y), 0, H - 1);
          const sIdx = (sy * W + sx) * 4;
          strandCol = [data[sIdx] / 255.0, data[sIdx + 1] / 255.0, data[sIdx + 2] / 255.0];
        } else if (params.colorMode === 'random') {
          strandCol = [Math.random(), Math.random(), Math.random()];
        }

        const alpha = masterAlpha;
        const segCount = Math.max(4, Math.min(20, Math.ceil(strandL / 3.0)));
        const stepS = strandL / segCount;

        // Function to emit a line anchored to contour with specific normal offset
        const emitContourLine = (normOffset: number, wScale: number, aScale: number) => {
          const pts: { x: number; y: number }[] = [];
          const wobbleSeed = Math.random() * Math.PI * 2.0;

          for (let s = 0; s <= segCount; ++s) {
            const curS = s0 + s * stepS;
            const evalPt = evaluateContour(chain, curS);

            // Hand-made natural curvature & wobble along the normal
            let handWobble = 0.0;
            if (params.handMade && curveAmt > 0.001) {
              const frac = s / segCount;
              // Organic parabolic/sinusoidal bow
              const sinArc = Math.sin(frac * Math.PI) * curveAmt * 3.5;
              const subtleJitter = (Math.sin(wobbleSeed + s * 1.5) * 0.4) * curveAmt;
              handWobble = sinArc + subtleJitter;
            }

            const totalOffset = normOffset + handWobble;
            const px = evalPt.x + evalPt.nx * totalOffset;
            const py = evalPt.y + evalPt.ny * totalOffset;
            pts.push({ x: px, y: py });
          }

          if (pts.length >= 2) {
            lines.push({
              points: pts,
              color: strandCol,
              width: strandThick * wScale,
              opacity: alpha * aScale,
            });
          }
        };

        // Primary line: offset is strictly params.edgeOffset (defaults to 0 for ZERO GAP!)
        emitContourLine(params.edgeOffset, 1.0, 1.0);

        // Duplicate Lines
        if (params.duplicate) {
          const dupCount = clamp(params.duplicateCount, 1, 4);
          const dupSpacing = Math.max(0.5, params.duplicateOffset);
          const dupWScale = params.duplicateWidth / Math.max(0.1, params.width);
          const dupAScale = params.duplicateOpacity / 100.0;

          for (let d = 1; d <= dupCount; ++d) {
            const dOffset = params.edgeOffset + d * dupSpacing;
            emitContourLine(dOffset, dupWScale, dupAScale);
          }
        }
      }

      return lines;
    }
  }

  // -------------------------------------------------------------------------
  // BRANCH B: OBJECT CHECKBOX IS OFF -> Ambient Procedural Strokes
  // -------------------------------------------------------------------------
  const baseAngle = (params.directionAngle * Math.PI) / 180.0;
  const angRand = (params.directionRand * Math.PI) / 180.0;

  for (let i = 0; i < count; ++i) {
    const startX = Math.random() * W;
    const startY = Math.random() * H;

    const angleJitter = (Math.random() * 2.0 - 1.0) * (angRand * 0.5);
    const strandAngle = baseAngle + angleJitter;

    const strandL = Math.max(3.0, baseLen * (1.0 + (Math.random() * 2.0 - 1.0) * lenRnd));
    const strandThick = clamp(baseThick * (1.0 + (Math.random() * 2.0 - 1.0) * thkRnd), 0.2, 12.0);

    let strandCol: [number, number, number] = [...baseRgb];
    if (params.colorMode === 'sampled') {
      const sx = clamp(Math.floor(startX), 0, W - 1);
      const sy = clamp(Math.floor(startY), 0, H - 1);
      const sIdx = (sy * W + sx) * 4;
      strandCol = [data[sIdx] / 255.0, data[sIdx + 1] / 255.0, data[sIdx + 2] / 255.0];
    } else if (params.colorMode === 'random') {
      strandCol = [Math.random(), Math.random(), Math.random()];
    }

    const segCount = params.handMade ? 6 : 2;
    const pts: { x: number; y: number }[] = [];
    const curveAmp = params.handMade ? curveAmt * strandL * 0.35 : 0.0;
    const curveDir = Math.random() > 0.5 ? 1 : -1;

    for (let s = 0; s <= segCount; ++s) {
      const t = s / segCount;
      const dist = t * strandL;
      const perpOffset = curveAmp * Math.sin(t * Math.PI) * curveDir;

      const px = startX + Math.cos(strandAngle) * dist - Math.sin(strandAngle) * perpOffset;
      const py = startY + Math.sin(strandAngle) * dist + Math.cos(strandAngle) * perpOffset;
      pts.push({ x: px, y: py });
    }

    lines.push({
      points: pts,
      color: strandCol,
      width: strandThick,
      opacity: masterAlpha,
    });

    if (params.duplicate) {
      const dupCount = clamp(params.duplicateCount, 1, 4);
      const dupOffset = params.duplicateOffset;
      for (let d = 1; d <= dupCount; ++d) {
        const offX = -Math.sin(strandAngle) * (dupOffset * d);
        const offY =  Math.cos(strandAngle) * (dupOffset * d);
        const dupPts = pts.map(p => ({ x: p.x + offX, y: p.y + offY }));
        lines.push({
          points: dupPts,
          color: strandCol,
          width: strandThick * (params.duplicateWidth / Math.max(0.1, params.width)),
          opacity: masterAlpha * (params.duplicateOpacity / 100.0),
        });
      }
    }
  }

  return lines;
}

export function drawLinesOnCanvas(
  ctx: CanvasRenderingContext2D,
  lines: RenderedLine[]
) {
  ctx.save();
  for (const line of lines) {
    if (line.points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(line.points[0].x, line.points[0].y);

    if (line.points.length === 2) {
      ctx.lineTo(line.points[1].x, line.points[1].y);
    } else {
      for (let i = 1; i < line.points.length - 1; ++i) {
        const xc = (line.points[i].x + line.points[i + 1].x) / 2;
        const yc = (line.points[i].y + line.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(line.points[i].x, line.points[i].y, xc, yc);
      }
      ctx.lineTo(line.points[line.points.length - 1].x, line.points[line.points.length - 1].y);
    }

    const r = Math.round(line.color[0] * 255);
    const g = Math.round(line.color[1] * 255);
    const b = Math.round(line.color[2] * 255);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${line.opacity})`;
    ctx.lineWidth = line.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}
