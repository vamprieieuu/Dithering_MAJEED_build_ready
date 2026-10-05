import { ContourLinesConfig } from '../types/dither';
import { hexToRgb } from './paletteData';

/**
 * Procedural Edge-Guided Contour Lines & Strands Engine
 * Ported from core/lines.cpp
 */
export function renderContourLines(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  config: ContourLinesConfig
) {
  if (!config.enabled || config.amount <= 0) return;

  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Compute Sobel luminance gradients for edge contour detection
  const luma = new Float32Array(width * height);
  for (let i = 0; i < luma.length; i++) {
    const idx = i * 4;
    luma[i] = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
  }

  const gradX = new Float32Array(width * height);
  const gradY = new Float32Array(width * height);
  const gradMag = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // Sobel 3x3
      const gx =
        -luma[(y - 1) * width + (x - 1)] + luma[(y - 1) * width + (x + 1)]
        - 2 * luma[y * width + (x - 1)] + 2 * luma[y * width + (x + 1)]
        - luma[(y + 1) * width + (x - 1)] + luma[(y + 1) * width + (x + 1)];

      const gy =
        -luma[(y - 1) * width + (x - 1)] - 2 * luma[(y - 1) * width + x] - luma[(y - 1) * width + (x + 1)]
        + luma[(y + 1) * width + (x - 1)] + 2 * luma[(y + 1) * width + x] + luma[(y + 1) * width + (x + 1)];

      gradX[idx] = gx;
      gradY[idx] = gy;
      gradMag[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Find candidate edge seed points
  const candidateSeeds: Array<{ x: number; y: number; mag: number }> = [];
  const step = 4;
  for (let y = 4; y < height - 4; y += step) {
    for (let x = 4; x < width - 4; x += step) {
      const mag = gradMag[y * width + x];
      if (mag > 40) {
        candidateSeeds.push({ x, y, mag });
      }
    }
  }

  // Setup drawing context
  ctx.save();
  ctx.strokeStyle = config.color;
  ctx.lineWidth = Math.max(0.5, config.width);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = (config.opacity / 100.0) * 0.85;

  const count = Math.min(config.amount, candidateSeeds.length > 0 && config.edgeGuided ? candidateSeeds.length : config.amount);
  const baseLen = config.length;
  const curvAmt = (config.curvature / 100.0) * 25.0;

  for (let i = 0; i < count; i++) {
    let startX = 0, startY = 0, baseAngle = 0;

    if (config.edgeGuided && candidateSeeds.length > 0) {
      const seed = candidateSeeds[(i * 7 + 13) % candidateSeeds.length];
      startX = seed.x;
      startY = seed.y;
      // Perpendicular to gradient = along the contour edge
      const gx = gradX[startY * width + startX];
      const gy = gradY[startY * width + startX];
      baseAngle = Math.atan2(gy, gx) + Math.PI / 2.0;
    } else {
      startX = Math.random() * width;
      startY = Math.random() * height;
      baseAngle = Math.random() * Math.PI * 2;
    }

    const strandLen = baseLen * (0.6 + Math.random() * 0.8);
    const midX = startX + Math.cos(baseAngle) * (strandLen * 0.5) + (Math.random() - 0.5) * curvAmt;
    const midY = startY + Math.sin(baseAngle) * (strandLen * 0.5) + (Math.random() - 0.5) * curvAmt;
    const endX = startX + Math.cos(baseAngle) * strandLen;
    const endY = startY + Math.sin(baseAngle) * strandLen;

    // Draw primary strand
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();

    // Draw duplicate companion line if enabled
    if (config.duplicate) {
      const offDist = 2.5;
      const offAngle = baseAngle + Math.PI / 2;
      const dx = Math.cos(offAngle) * offDist;
      const dy = Math.sin(offAngle) * offDist;

      ctx.beginPath();
      ctx.moveTo(startX + dx, startY + dy);
      ctx.quadraticCurveTo(midX + dx, midY + dy, endX + dx, endY + dy);
      ctx.stroke();
    }
  }

  ctx.restore();
}
