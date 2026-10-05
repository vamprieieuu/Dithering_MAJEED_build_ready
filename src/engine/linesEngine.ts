import { DitherSettings } from '../types/dither';
import { hexToRgb } from './ditherEngine';

interface ContourPoint {
  x: number;
  y: number;
  angle: number;
}

export function renderLinesOverlay(
  targetCtx: CanvasRenderingContext2D,
  srcData: ImageData,
  settings: DitherSettings
) {
  if (!settings.enableLines || settings.linesAmount <= 0) return;

  const W = srcData.width;
  const H = srcData.height;
  const src = srcData.data;

  // Extract edges if Object Mode is ON
  const edgePoints: ContourPoint[] = [];

  if (settings.lineObjectMode) {
    const luma = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      luma[i] = 0.2126 * (src[idx] / 255) + 0.7152 * (src[idx + 1] / 255) + 0.0722 * (src[idx + 2] / 255);
    }

    const threshold = (settings.lineEdgeThreshold / 100.0) * 0.4;
    // Sobel gradient
    for (let y = 2; y < H - 2; y += 2) {
      for (let x = 2; x < W - 2; x += 2) {
        const tl = luma[(y - 1) * W + (x - 1)], t = luma[(y - 1) * W + x], tr = luma[(y - 1) * W + (x + 1)];
        const l  = luma[y * W + (x - 1)],                                   r  = luma[y * W + (x + 1)];
        const bl = luma[(y + 1) * W + (x - 1)], b = luma[(y + 1) * W + x], br = luma[(y + 1) * W + (x + 1)];

        const gx = (tr + 2 * r + br) - (tl + 2 * l + bl);
        const gy = (bl + 2 * b + br) - (tl + 2 * t + tr);
        const mag = Math.sqrt(gx * gx + gy * gy);

        if (mag > threshold) {
          // Tangent angle is perpendicular to gradient
          const angle = Math.atan2(gy, gx) + Math.PI / 2;
          edgePoints.push({ x, y, angle });
        }
      }
    }
  }

  const [lr, lg, lb] = hexToRgb(settings.lineColor);
  const opacity = (settings.lineOpacity / 100.0);
  targetCtx.save();
  targetCtx.strokeStyle = `rgba(${Math.round(lr * 255)}, ${Math.round(lg * 255)}, ${Math.round(lb * 255)}, ${opacity})`;
  targetCtx.lineWidth = Math.max(0.2, settings.lineWidth);
  targetCtx.lineCap = 'round';
  targetCtx.lineJoin = 'round';

  const count = Math.min(settings.linesAmount, settings.lineObjectMode ? edgePoints.length : settings.linesAmount);
  const len = settings.lineLength;
  const curveAmt = settings.lineHandMade ? (settings.lineCurve / 100.0) * 15 : 0;

  for (let i = 0; i < count; i++) {
    let startX = 0, startY = 0, angle = 0;

    if (settings.lineObjectMode && edgePoints.length > 0) {
      const idx = Math.floor(Math.random() * edgePoints.length);
      const pt = edgePoints[idx];
      startX = pt.x;
      startY = pt.y;
      angle = pt.angle + (Math.random() - 0.5) * 0.2;
    } else {
      startX = Math.random() * W;
      startY = Math.random() * H;
      angle = Math.random() * Math.PI * 2;
    }

    const randLen = len * (1.0 + (Math.random() - 0.5) * (settings.lineLengthRand / 100.0));
    const endX = startX + Math.cos(angle) * randLen;
    const endY = startY + Math.sin(angle) * randLen;

    const renderSingleStrand = (ox: number, oy: number, w: number, alphaMult: number) => {
      targetCtx.beginPath();
      targetCtx.lineWidth = w;
      targetCtx.strokeStyle = `rgba(${Math.round(lr * 255)}, ${Math.round(lg * 255)}, ${Math.round(lb * 255)}, ${opacity * alphaMult})`;

      if (curveAmt > 0) {
        const midX = (startX + endX) * 0.5 + ox + Math.sin(angle) * (Math.random() - 0.5) * curveAmt;
        const midY = (startY + endY) * 0.5 + oy - Math.cos(angle) * (Math.random() - 0.5) * curveAmt;
        targetCtx.moveTo(startX + ox, startY + oy);
        targetCtx.quadraticCurveTo(midX, midY, endX + ox, endY + oy);
      } else {
        targetCtx.moveTo(startX + ox, startY + oy);
        targetCtx.lineTo(endX + ox, endY + oy);
      }
      targetCtx.stroke();
    };

    // Main line
    renderSingleStrand(0, 0, settings.lineWidth, 1.0);

    // Duplicate companion lines
    if (settings.lineDuplicate) {
      const normalX = -Math.sin(angle);
      const normalY = Math.cos(angle);
      const dupCount = Math.min(4, Math.max(1, settings.lineDuplicateCount));
      const dupOffset = settings.lineDuplicateOffset;

      for (let d = 1; d <= dupCount; d++) {
        const off = (d % 2 === 1 ? 1 : -1) * Math.ceil(d / 2) * dupOffset;
        renderSingleStrand(normalX * off, normalY * off, Math.max(0.2, settings.lineWidth * 0.75), 0.75);
      }
    }
  }

  targetCtx.restore();
}
