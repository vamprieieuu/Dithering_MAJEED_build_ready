import { LinesParams } from '../types';
import { hexToRgb, luma709 } from './paletteUtils';

export interface ContourPoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
  tx: number;
  ty: number;
}

export interface ContourLine {
  points: ContourPoint[];
  color: [number, number, number];
  width: number;
  opacity: number;
}

export function extractEdgesAndRenderLines(
  srcData: ImageData,
  params: LinesParams,
  outCtx: CanvasRenderingContext2D
): void {
  if (!params.enabled || params.amount <= 0) return;

  const W = srcData.width;
  const H = srcData.height;
  const src = srcData.data;

  // 1. Compute Luminance + Alpha weighted
  const luma = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const a = src[idx + 3] / 255;
      luma[y * W + x] = luma709(src[idx], src[idx + 1], src[idx + 2]) * a;
    }
  }

  // 2. Sobel edge gradient
  const gx = new Float32Array(W * H);
  const gy = new Float32Array(W * H);
  const mag = new Float32Array(W * H);

  let maxMag = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const idx = y * W + x;
      const tl = luma[(y - 1) * W + (x - 1)];
      const tc = luma[(y - 1) * W + x];
      const tr = luma[(y - 1) * W + (x + 1)];
      const ml = luma[y * W + (x - 1)];
      const mr = luma[y * W + (x + 1)];
      const bl = luma[(y + 1) * W + (x - 1)];
      const bc = luma[(y + 1) * W + x];
      const br = luma[(y + 1) * W + (x + 1)];

      const xGrad = tr + 2 * mr + br - (tl + 2 * ml + bl);
      const yGrad = bl + 2 * bc + br - (tl + 2 * tc + tr);
      const m = Math.sqrt(xGrad * xGrad + yGrad * yGrad);

      gx[idx] = xGrad;
      gy[idx] = yGrad;
      mag[idx] = m;
      if (m > maxMag) maxMag = m;
    }
  }

  const thresh = (params.edgeThreshold / 100) * (maxMag > 0 ? maxMag : 1);
  const edgePixels: Array<{ x: number; y: number; m: number }> = [];

  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      const m = mag[y * W + x];
      if (m >= thresh) {
        edgePixels.push({ x, y, m });
      }
    }
  }

  outCtx.save();
  outCtx.lineCap = 'round';
  outCtx.lineJoin = 'round';

  const baseRgb = hexToRgb(params.color);
  const totalStrands = Math.min(params.amount, params.objectMode ? edgePixels.length : params.amount);
  const step = Math.max(1, Math.floor(edgePixels.length / totalStrands));

  // Render Strands
  for (let i = 0; i < totalStrands; i++) {
    let startX = 0;
    let startY = 0;
    let dirX = 1;
    let dirY = 0;

    if (params.objectMode && edgePixels.length > 0) {
      const p = edgePixels[(i * step) % edgePixels.length];
      startX = p.x;
      startY = p.y;
      const idx = startY * W + startX;
      const gX = gx[idx];
      const gY = gy[idx];
      const m = mag[idx] || 1;
      // Along edge (tangent is perpendicular to gradient)
      dirX = -gY / m;
      dirY = gX / m;
    } else {
      startX = Math.random() * W;
      startY = Math.random() * H;
      const angle = (Math.random() - 0.5) * Math.PI;
      dirX = Math.cos(angle);
      dirY = Math.sin(angle);
    }

    // Determine color
    let strokeColor = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${params.opacity / 100})`;
    if (params.colorMode === 'sampled') {
      const sX = Math.max(0, Math.min(W - 1, Math.round(startX)));
      const sY = Math.max(0, Math.min(H - 1, Math.round(startY)));
      const pIdx = (sY * W + sX) * 4;
      strokeColor = `rgba(${src[pIdx]}, ${src[pIdx + 1]}, ${src[pIdx + 2]}, ${params.opacity / 100})`;
    } else if (params.colorMode === 'random') {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      strokeColor = `rgba(${r}, ${g}, ${b}, ${params.opacity / 100})`;
    }

    outCtx.strokeStyle = strokeColor;
    outCtx.lineWidth = params.width;

    const strandLength = params.length * (0.7 + Math.random() * 0.6);
    const numSteps = Math.max(4, Math.floor(strandLength / 4));
    const stepSize = strandLength / numSteps;

    // Draw main strand
    const drawSingleStrand = (offsetX: number, offsetY: number, widthScale: number = 1) => {
      outCtx.lineWidth = params.width * widthScale;
      outCtx.beginPath();
      let curX = startX + offsetX;
      let curY = startY + offsetY;
      outCtx.moveTo(curX, curY);

      for (let s = 1; s <= numSteps; s++) {
        // Curve wobble if handmade
        let wobble = 0;
        if (params.handMade) {
          const freq = 0.2;
          wobble = Math.sin(s * freq + i) * (params.curve / 100) * 4;
        }

        // Advance along tangent
        curX += dirX * stepSize + -dirY * wobble;
        curY += dirY * stepSize + dirX * wobble;
        outCtx.lineTo(curX, curY);
      }
      outCtx.stroke();
    };

    drawSingleStrand(0, 0, 1.0);

    // Duplicate companion lines
    if (params.duplicate) {
      const count = params.duplicateCount || 1;
      const off = params.duplicateOffset || 2.5;
      for (let d = 1; d <= count; d++) {
        const perpX = -dirY * off * d;
        const perpY = dirX * off * d;
        drawSingleStrand(perpX, perpY, 0.7);
      }
    }
  }

  outCtx.restore();
}
