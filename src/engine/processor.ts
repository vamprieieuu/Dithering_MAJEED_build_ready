import { DitherStudioParams, LevelsParams } from '../types';
import {
  ALL_DITHER_ALGORITHMS,
  getScreenMap,
  sampleScreen,
  bayerThreshold,
  blueNoiseThreshold,
  ignThreshold,
  KERNELS,
  F_SERP,
  F_XEROX,
  F_NOISE,
} from './ditherAlgorithms';
import {
  hexToRgb,
  rgbToHex,
  luma709,
  findNearestColorIndex,
  RGBColor,
} from './paletteUtils';

// ------------------------------------------------------------ Preprocessing Helpers
export function applyLevels(
  src: Float32Array,
  W: number,
  H: number,
  levels: LevelsParams
): void {
  const { inBlack, inGamma, inWhite, outBlack, outWhite } = levels;
  const inMin = inBlack / 255;
  const inMax = inWhite / 255;
  const outMin = outBlack / 255;
  const outMax = outWhite / 255;
  const invRange = inMax > inMin ? 1 / (inMax - inMin) : 1;
  const invGamma = inGamma > 0 ? 1 / inGamma : 1;

  // Build 256-entry lookup table for speed
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    let norm = (v - inMin) * invRange;
    norm = Math.max(0, Math.min(1, norm));
    if (invGamma !== 1) {
      norm = Math.pow(norm, invGamma);
    }
    lut[i] = Math.max(0, Math.min(1, outMin + norm * (outMax - outMin)));
  }

  const len = W * H * 4;
  for (let i = 0; i < len; i += 4) {
    const rInt = Math.max(0, Math.min(255, Math.round(src[i] * 255)));
    const gInt = Math.max(0, Math.min(255, Math.round(src[i + 1] * 255)));
    const bInt = Math.max(0, Math.min(255, Math.round(src[i + 2] * 255)));
    src[i] = lut[rInt];
    src[i + 1] = lut[gInt];
    src[i + 2] = lut[bInt];
  }
}

export function applyBlur(
  src: Float32Array,
  W: number,
  H: number,
  radius: number
): void {
  if (radius <= 0.1) return;
  const r = Math.max(1, Math.round(radius));
  const temp = new Float32Array(src.length);

  // Horizontal pass
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let k = -r; k <= r; k++) {
        const nx = Math.max(0, Math.min(W - 1, x + k));
        const idx = (y * W + nx) * 4;
        rSum += src[idx];
        gSum += src[idx + 1];
        bSum += src[idx + 2];
        count++;
      }
      const outIdx = (y * W + x) * 4;
      temp[outIdx] = rSum / count;
      temp[outIdx + 1] = gSum / count;
      temp[outIdx + 2] = bSum / count;
      temp[outIdx + 3] = src[outIdx + 3];
    }
  }

  // Vertical pass
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let k = -r; k <= r; k++) {
        const ny = Math.max(0, Math.min(H - 1, y + k));
        const idx = (ny * W + x) * 4;
        rSum += temp[idx];
        gSum += temp[idx + 1];
        bSum += temp[idx + 2];
        count++;
      }
      const outIdx = (y * W + x) * 4;
      src[outIdx] = rSum / count;
      src[outIdx + 1] = gSum / count;
      src[outIdx + 2] = bSum / count;
    }
  }
}

export function applySharpen(
  src: Float32Array,
  W: number,
  H: number,
  radius: number,
  strength: number
): void {
  if (strength <= 0 || radius <= 0) return;
  const blurred = new Float32Array(src);
  applyBlur(blurred, W, H, radius);
  const factor = strength / 100;
  const len = W * H * 4;
  for (let i = 0; i < len; i += 4) {
    src[i] = Math.max(0, Math.min(1, src[i] + (src[i] - blurred[i]) * factor));
    src[i + 1] = Math.max(0, Math.min(1, src[i + 1] + (src[i + 1] - blurred[i + 1]) * factor));
    src[i + 2] = Math.max(0, Math.min(1, src[i + 2] + (src[i + 2] - blurred[i + 2]) * factor));
  }
}

export function applyNoiseOrDenoise(
  src: Float32Array,
  W: number,
  H: number,
  val: number
): void {
  if (val === 0) return;
  if (val < 0) {
    // Denoise: gentle median blur
    applyBlur(src, W, H, Math.abs(val) * 0.15);
  } else {
    // Film grain noise
    const noiseAmt = (val / 100) * 0.25;
    const len = W * H * 4;
    for (let i = 0; i < len; i += 4) {
      const g = (Math.random() - 0.5) * noiseAmt;
      src[i] = Math.max(0, Math.min(1, src[i] + g));
      src[i + 1] = Math.max(0, Math.min(1, src[i + 1] + g));
      src[i + 2] = Math.max(0, Math.min(1, src[i + 2] + g));
    }
  }
}

export function applyHueSaturationInvert(
  src: Float32Array,
  W: number,
  H: number,
  hueShift: number,
  satShift: number,
  invertAmt: number
): void {
  if (hueShift === 0 && satShift === 0 && invertAmt === 0) return;
  const satScale = 1 + satShift / 100;
  const invFactor = invertAmt / 100;

  const len = W * H * 4;
  for (let i = 0; i < len; i += 4) {
    let r = src[i];
    let g = src[i + 1];
    let b = src[i + 2];

    // Invert blend
    if (invFactor > 0) {
      r = r * (1 - invFactor) + (1 - r) * invFactor;
      g = g * (1 - invFactor) + (1 - g) * invFactor;
      b = b * (1 - invFactor) + (1 - b) * invFactor;
    }

    // Saturation
    if (satShift !== 0) {
      const l = luma709(r, g, b);
      r = l + (r - l) * satScale;
      g = l + (g - l) * satScale;
      b = l + (b - l) * satScale;
    }

    // Hue rotation around luma axis
    if (hueShift !== 0) {
      const angle = (hueShift * Math.PI) / 180;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const rx = (0.213 + cosA * 0.787 - sinA * 0.213) * r +
                 (0.715 - cosA * 0.715 - sinA * 0.715) * g +
                 (0.072 - cosA * 0.072 + sinA * 0.928) * b;
      const gx = (0.213 - cosA * 0.213 + sinA * 0.143) * r +
                 (0.715 + cosA * 0.285 + sinA * 0.140) * g +
                 (0.072 - cosA * 0.072 - sinA * 0.283) * b;
      const bx = (0.213 - cosA * 0.213 - sinA * 0.787) * r +
                 (0.715 - cosA * 0.715 + sinA * 0.715) * g +
                 (0.072 + cosA * 0.928 + sinA * 0.072) * b;
      r = rx;
      g = gx;
      b = bx;
    }

    src[i] = Math.max(0, Math.min(1, r));
    src[i + 1] = Math.max(0, Math.min(1, g));
    src[i + 2] = Math.max(0, Math.min(1, b));
  }
}

// ------------------------------------------------------------ Main Dither Processing
export interface ProcessResult {
  composite: ImageData;
  highlightsLayer?: ImageData;
  midtonesLayer?: ImageData;
  shadowsLayer?: ImageData;
  rChannelLayer?: ImageData;
  gChannelLayer?: ImageData;
  bChannelLayer?: ImageData;
}

export function processDitherImage(
  inputImgData: ImageData,
  params: DitherStudioParams
): ProcessResult {
  const W = inputImgData.width;
  const H = inputImgData.height;
  const rawData = inputImgData.data;

  // 1. Convert to normalized straight Float32 RGBA [0..1]
  const buf = new Float32Array(W * H * 4);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = rawData[i] / 255;
    buf[i + 1] = rawData[i + 1] / 255;
    buf[i + 2] = rawData[i + 2] / 255;
    buf[i + 3] = rawData[i + 3] / 255;
  }

  // 2. Pre-processing pass
  applyHueSaturationInvert(buf, W, H, params.hue, params.saturation, params.invert);
  applyLevels(buf, W, H, params.levels);
  if (params.noise !== 0) applyNoiseOrDenoise(buf, W, H, params.noise);
  if (params.sharpenStrength > 0) applySharpen(buf, W, H, params.sharpenRadius, params.sharpenStrength);
  if (params.blur > 0) applyBlur(buf, W, H, params.blur);

  // 3. Algorithm setup
  const algo = ALL_DITHER_ALGORITHMS[Math.max(0, Math.min(ALL_DITHER_ALGORITHMS.length - 1, params.algoId))];
  
  // Effective scale factor: link DPI to scale if enabled
  let effScale = Math.max(1, params.scale);
  if (params.linkDpiScale) {
    effScale *= params.dpi / 300;
  }

  // Prepare Output buffers
  const outComposite = new Uint8ClampedArray(W * H * 4);
  let outHigh: Uint8ClampedArray | undefined;
  let outMid: Uint8ClampedArray | undefined;
  let outShad: Uint8ClampedArray | undefined;

  const isTonal = params.renderMode === 'tonal';
  if (isTonal) {
    outHigh = new Uint8ClampedArray(W * H * 4);
    if (params.tonalMapping >= 2) outShad = new Uint8ClampedArray(W * H * 4);
    if (params.tonalMapping >= 3) outMid = new Uint8ClampedArray(W * H * 4);
  }

  // Color Swatches
  const colHigh = hexToRgb(params.highlightsColor);
  const colMid = hexToRgb(params.midtonesColor);
  const colShad = hexToRgb(params.shadowsColor);
  const colBg = hexToRgb(params.backgroundColor);

  // Palette for indexed mode
  const rgbPalette: RGBColor[] = params.palette.map((h) => hexToRgb(h));
  const suppressedSet = new Set(params.suppressedSwatches);

  // 4. Branch: Continuous Screens & Ordered vs Error Diffusion
  if (
    algo.kind === 'screen' ||
    algo.kind === 'bayer' ||
    algo.kind === 'blue' ||
    algo.kind === 'ign' ||
    algo.kind === 'white'
  ) {
    let screenMap: Float32Array | null = null;
    let pitch = 6;
    if (algo.kind === 'screen') {
      screenMap = getScreenMap(algo.param);
      pitch = Math.max(1, algo.cell * effScale);
    }
    const bayN = Math.max(2, algo.param);
    const rad = (algo.angle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const rIn = buf[idx];
        const gIn = buf[idx + 1];
        const bIn = buf[idx + 2];
        const aIn = buf[idx + 3];
        const luma = luma709(rIn, gIn, bIn);

        // Compute threshold T for pixel (x, y)
        let T = 0.5;
        if (algo.kind === 'screen' && screenMap) {
          const xs = x + 0.5;
          const ys = y + 0.5;
          const u2 = (xs * cosA + ys * sinA) / pitch;
          const v2 = (-xs * sinA + ys * cosA) / pitch;
          T = sampleScreen(screenMap, u2, v2);
        } else if (algo.kind === 'bayer') {
          const bx = Math.floor(x / effScale);
          const by = Math.floor(y / effScale);
          T = bayerThreshold(bx, by, bayN);
        } else if (algo.kind === 'blue') {
          const bx = Math.floor(x / effScale);
          const by = Math.floor(y / effScale);
          T = blueNoiseThreshold(bx, by, 0);
        } else if (algo.kind === 'ign') {
          T = ignThreshold(x / effScale, y / effScale);
        } else if (algo.kind === 'white') {
          T = Math.random();
        }

        // True dot density coverage gating
        const covProb = params.dotCoverage / 100;
        const gate = Math.random();
        const passesCoverage = gate < covProb;

        if (isTonal) {
          // Tonal 1, 2, or 3 color mapping
          const hiThresh = params.highlightsThreshold / 255;
          const shThresh = params.shadowsThreshold / 255;
          const midOverlap = params.midtonesOverlap / 255;

          let rFinal = colBg.r;
          let gFinal = colBg.g;
          let bFinal = colBg.b;
          let aFinal = params.knockoutMode ? 0 : 255;

          if (params.tonalMapping === 1) {
            // Single ink on background / transparent
            const isDot = luma > T;
            if (isDot && passesCoverage) {
              rFinal = colHigh.r;
              gFinal = colHigh.g;
              bFinal = colHigh.b;
              aFinal = 255;
              if (outHigh) {
                outHigh[idx] = colHigh.r;
                outHigh[idx + 1] = colHigh.g;
                outHigh[idx + 2] = colHigh.b;
                outHigh[idx + 3] = 255;
              }
            }
          } else if (params.tonalMapping === 2) {
            // Highlights & Shadows
            if (luma >= hiThresh) {
              const isDot = (luma - hiThresh) / (1 - hiThresh || 1) > T;
              if (isDot && passesCoverage) {
                rFinal = colHigh.r;
                gFinal = colHigh.g;
                bFinal = colHigh.b;
                aFinal = 255;
                if (outHigh) {
                  outHigh[idx] = colHigh.r;
                  outHigh[idx + 1] = colHigh.g;
                  outHigh[idx + 2] = colHigh.b;
                  outHigh[idx + 3] = 255;
                }
              }
            } else {
              const isDot = luma / (hiThresh || 1) < T;
              if (isDot && passesCoverage) {
                rFinal = colShad.r;
                gFinal = colShad.g;
                bFinal = colShad.b;
                aFinal = 255;
                if (outShad) {
                  outShad[idx] = colShad.r;
                  outShad[idx + 1] = colShad.g;
                  outShad[idx + 2] = colShad.b;
                  outShad[idx + 3] = 255;
                }
              }
            }
          } else {
            // 3-Color: Highlights, Midtones, Shadows
            if (luma >= hiThresh) {
              const isDot = (luma - hiThresh) / (1 - hiThresh || 1) > T;
              if (isDot && passesCoverage) {
                rFinal = colHigh.r;
                gFinal = colHigh.g;
                bFinal = colHigh.b;
                aFinal = 255;
                if (outHigh) {
                  outHigh[idx] = colHigh.r;
                  outHigh[idx + 1] = colHigh.g;
                  outHigh[idx + 2] = colHigh.b;
                  outHigh[idx + 3] = 255;
                }
              }
            } else if (luma <= shThresh) {
              const isDot = luma / (shThresh || 1) < T;
              if (isDot && passesCoverage) {
                rFinal = colShad.r;
                gFinal = colShad.g;
                bFinal = colShad.b;
                aFinal = 255;
                if (outShad) {
                  outShad[idx] = colShad.r;
                  outShad[idx + 1] = colShad.g;
                  outShad[idx + 2] = colShad.b;
                  outShad[idx + 3] = 255;
                }
              }
            } else {
              // Midtone band
              const isDot = Math.abs(luma - (hiThresh + shThresh) / 2) < midOverlap * T;
              if (isDot && passesCoverage) {
                rFinal = colMid.r;
                gFinal = colMid.g;
                bFinal = colMid.b;
                aFinal = 255;
                if (outMid) {
                  outMid[idx] = colMid.r;
                  outMid[idx + 1] = colMid.g;
                  outMid[idx + 2] = colMid.b;
                  outMid[idx + 3] = 255;
                }
              }
            }
          }

          outComposite[idx] = rFinal;
          outComposite[idx + 1] = gFinal;
          outComposite[idx + 2] = bFinal;
          outComposite[idx + 3] = aFinal;
        } else {
          // Grade Mode (Gray, RGB, Indexed)
          if (params.colorspace === 'gray') {
            const isWhite = luma > T;
            const v = isWhite ? 255 : 0;
            outComposite[idx] = v;
            outComposite[idx + 1] = v;
            outComposite[idx + 2] = v;
            outComposite[idx + 3] = Math.round(aIn * 255);
          } else if (params.colorspace === 'rgb') {
            const rDot = rIn > T ? 255 : 0;
            const gDot = gIn > T ? 255 : 0;
            const bDot = bIn > T ? 255 : 0;
            outComposite[idx] = rDot;
            outComposite[idx + 1] = gDot;
            outComposite[idx + 2] = bDot;
            outComposite[idx + 3] = Math.round(aIn * 255);
          } else {
            // Indexed Palette
            const spreadMod = (T - 0.5) * (params.spread / 100);
            const targetColor: RGBColor = {
              r: Math.max(0, Math.min(255, Math.round((rIn + spreadMod) * 255))),
              g: Math.max(0, Math.min(255, Math.round((gIn + spreadMod) * 255))),
              b: Math.max(0, Math.min(255, Math.round((bIn + spreadMod) * 255))),
            };
            const matchIdx = findNearestColorIndex(targetColor, rgbPalette, suppressedSet);
            const matched = rgbPalette[matchIdx] || rgbPalette[0];
            outComposite[idx] = matched.r;
            outComposite[idx + 1] = matched.g;
            outComposite[idx + 2] = matched.b;
            outComposite[idx + 3] = Math.round(aIn * 255);
          }
        }
      }
    }
  } else {
    // ---------------- Error Diffusion (15 kernels)
    const block = params.pixelate && effScale > 1 ? Math.max(1, Math.round(effScale)) : 1;
    const gw = Math.max(1, Math.floor((W + block - 1) / block));
    const gh = Math.max(1, Math.floor((H + block - 1) / block));

    const kid = algo.param & 255;
    const kernel = KERNELS[Math.max(0, Math.min(KERNELS.length - 1, kid))];
    const isSerpentine = params.serpentine || (algo.param & F_SERP) !== 0;
    const isXerox = (algo.param & F_XEROX) !== 0;

    // Downsample input into grid
    const gridR = new Float32Array(gw * gh);
    const gridG = new Float32Array(gw * gh);
    const gridB = new Float32Array(gw * gh);
    const gridLuma = new Float32Array(gw * gh);

    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const xStart = gx * block;
        const yStart = gy * block;
        const xEnd = Math.min(W, xStart + block);
        const yEnd = Math.min(H, yStart + block);
        let rAcc = 0, gAcc = 0, bAcc = 0, cnt = 0;
        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            const idx = (y * W + x) * 4;
            rAcc += buf[idx];
            gAcc += buf[idx + 1];
            bAcc += buf[idx + 2];
            cnt++;
          }
        }
        const invCnt = cnt > 0 ? 1 / cnt : 1;
        const rAvg = rAcc * invCnt;
        const gAvg = gAcc * invCnt;
        const bAvg = bAcc * invCnt;
        const gIdx = gy * gw + gx;
        gridR[gIdx] = rAvg;
        gridG[gIdx] = gAvg;
        gridB[gIdx] = bAvg;
        gridLuma[gIdx] = luma709(rAvg, gAvg, bAvg);
      }
    }

    // Xerox photocopy toner edge boost
    if (isXerox && gw > 2 && gh > 2) {
      const origLuma = new Float32Array(gridLuma);
      for (let gy = 1; gy < gh - 1; gy++) {
        for (let gx = 1; gx < gw - 1; gx++) {
          const idx = gy * gw + gx;
          const c = origLuma[idx];
          const lap = 4 * c -
            origLuma[(gy - 1) * gw + gx] -
            origLuma[(gy + 1) * gw + gx] -
            origLuma[gy * gw + (gx - 1)] -
            origLuma[gy * gw + (gx + 1)];
          const toner = (Math.random() - 0.5) * 0.12;
          gridLuma[idx] = Math.max(0, Math.min(1, c + lap * 0.55 + toner));
        }
      }
    }

    // Diffuse plane
    const diffuseLuma = new Float32Array(gridLuma);
    const diffusedGridR = new Float32Array(gridR);
    const diffusedGridG = new Float32Array(gridG);
    const diffusedGridB = new Float32Array(gridB);

    if (isTonal || params.colorspace === 'gray') {
      for (let gy = 0; gy < gh; gy++) {
        const rev = isSerpentine && (gy & 1) === 1;
        for (let i = 0; i < gw; i++) {
          const gx = rev ? gw - 1 - i : i;
          const gIdx = gy * gw + gx;
          const v = diffuseLuma[gIdx];
          const q = v >= 0.5 ? 1 : 0;
          const err = v - q;
          diffuseLuma[gIdx] = q;

          for (let ti = 0; ti < kernel.ntaps; ti++) {
            const tap = kernel.taps[ti];
            const nx = gx + (rev ? -tap.dx : tap.dx);
            const ny = gy + tap.dy;
            if (nx >= 0 && nx < gw && ny >= 0 && ny < gh) {
              diffuseLuma[ny * gw + nx] += err * tap.w;
            }
          }
        }
      }
    } else if (params.colorspace === 'rgb') {
      // 3 channel diffusion
      const planes = [diffusedGridR, diffusedGridG, diffusedGridB];
      for (const pl of planes) {
        for (let gy = 0; gy < gh; gy++) {
          const rev = isSerpentine && (gy & 1) === 1;
          for (let i = 0; i < gw; i++) {
            const gx = rev ? gw - 1 - i : i;
            const gIdx = gy * gw + gx;
            const v = pl[gIdx];
            const q = v >= 0.5 ? 1 : 0;
            const err = v - q;
            pl[gIdx] = q;

            for (let ti = 0; ti < kernel.ntaps; ti++) {
              const tap = kernel.taps[ti];
              const nx = gx + (rev ? -tap.dx : tap.dx);
              const ny = gy + tap.dy;
              if (nx >= 0 && nx < gw && ny >= 0 && ny < gh) {
                pl[ny * gw + nx] += err * tap.w;
              }
            }
          }
        }
      }
    } else {
      // Indexed palette error diffusion
      for (let gy = 0; gy < gh; gy++) {
        const rev = isSerpentine && (gy & 1) === 1;
        for (let i = 0; i < gw; i++) {
          const gx = rev ? gw - 1 - i : i;
          const gIdx = gy * gw + gx;
          const curCol: RGBColor = {
            r: Math.max(0, Math.min(255, Math.round(diffusedGridR[gIdx] * 255))),
            g: Math.max(0, Math.min(255, Math.round(diffusedGridG[gIdx] * 255))),
            b: Math.max(0, Math.min(255, Math.round(diffusedGridB[gIdx] * 255))),
          };
          const matchIdx = findNearestColorIndex(curCol, rgbPalette, suppressedSet);
          const matched = rgbPalette[matchIdx] || rgbPalette[0];

          const errR = (curCol.r - matched.r) / 255;
          const errG = (curCol.g - matched.g) / 255;
          const errB = (curCol.b - matched.b) / 255;

          diffusedGridR[gIdx] = matched.r / 255;
          diffusedGridG[gIdx] = matched.g / 255;
          diffusedGridB[gIdx] = matched.b / 255;

          for (let ti = 0; ti < kernel.ntaps; ti++) {
            const tap = kernel.taps[ti];
            const nx = gx + (rev ? -tap.dx : tap.dx);
            const ny = gy + tap.dy;
            if (nx >= 0 && nx < gw && ny >= 0 && ny < gh) {
              const nIdx = ny * gw + nx;
              diffusedGridR[nIdx] += errR * tap.w;
              diffusedGridG[nIdx] += errG * tap.w;
              diffusedGridB[nIdx] += errB * tap.w;
            }
          }
        }
      }
    }

    // Reconstruct full resolution output from grid
    for (let y = 0; y < H; y++) {
      const gy = Math.min(gh - 1, Math.floor(y / block));
      for (let x = 0; x < W; x++) {
        const gx = Math.min(gw - 1, Math.floor(x / block));
        const gIdx = gy * gw + gx;
        const idx = (y * W + x) * 4;

        if (isTonal) {
          const lVal = diffuseLuma[gIdx];
          const isWhite = lVal >= 0.5;

          let rFinal = colBg.r;
          let gFinal = colBg.g;
          let bFinal = colBg.b;
          let aFinal = params.knockoutMode ? 0 : 255;

          if (isWhite) {
            rFinal = colHigh.r;
            gFinal = colHigh.g;
            bFinal = colHigh.b;
            aFinal = 255;
            if (outHigh) {
              outHigh[idx] = colHigh.r;
              outHigh[idx + 1] = colHigh.g;
              outHigh[idx + 2] = colHigh.b;
              outHigh[idx + 3] = 255;
            }
          } else if (params.tonalMapping >= 2) {
            rFinal = colShad.r;
            gFinal = colShad.g;
            bFinal = colShad.b;
            aFinal = 255;
            if (outShad) {
              outShad[idx] = colShad.r;
              outShad[idx + 1] = colShad.g;
              outShad[idx + 2] = colShad.b;
              outShad[idx + 3] = 255;
            }
          }

          outComposite[idx] = rFinal;
          outComposite[idx + 1] = gFinal;
          outComposite[idx + 2] = bFinal;
          outComposite[idx + 3] = aFinal;
        } else if (params.colorspace === 'gray') {
          const v = diffuseLuma[gIdx] >= 0.5 ? 255 : 0;
          outComposite[idx] = v;
          outComposite[idx + 1] = v;
          outComposite[idx + 2] = v;
          outComposite[idx + 3] = 255;
        } else if (params.colorspace === 'rgb') {
          outComposite[idx] = diffusedGridR[gIdx] >= 0.5 ? 255 : 0;
          outComposite[idx + 1] = diffusedGridG[gIdx] >= 0.5 ? 255 : 0;
          outComposite[idx + 2] = diffusedGridB[gIdx] >= 0.5 ? 255 : 0;
          outComposite[idx + 3] = 255;
        } else {
          // Indexed
          outComposite[idx] = Math.round(diffusedGridR[gIdx] * 255);
          outComposite[idx + 1] = Math.round(diffusedGridG[gIdx] * 255);
          outComposite[idx + 2] = Math.round(diffusedGridB[gIdx] * 255);
          outComposite[idx + 3] = 255;
        }
      }
    }
  }

  const compositeImgData = new ImageData(outComposite as any, W, H);
  const result: ProcessResult = {
    composite: compositeImgData,
  };

  if (outHigh) result.highlightsLayer = new ImageData(outHigh as any, W, H);
  if (outMid) result.midtonesLayer = new ImageData(outMid as any, W, H);
  if (outShad) result.shadowsLayer = new ImageData(outShad as any, W, H);

  return result;
}

// ------------------------------------------------------------ Vector SVG Exporter
export function exportToSvg(
  imgData: ImageData,
  stepSize: number = 2
): string {
  const W = imgData.width;
  const H = imgData.height;
  const data = imgData.data;

  const circles: string[] = [];
  const radius = (stepSize / 2) * 0.95;

  for (let y = 0; y < H; y += stepSize) {
    for (let x = 0; x < W; x += stepSize) {
      const idx = (y * W + x) * 4;
      const a = data[idx + 3];
      if (a > 20) {
        const hex = rgbToHex(data[idx], data[idx + 1], data[idx + 2]);
        circles.push(
          `<circle cx="${x + radius}" cy="${y + radius}" r="${radius}" fill="${hex}" />`
        );
      }
    }
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="transparent" />
  <g id="dither-elements">
    ${circles.join('\n    ')}
  </g>
</svg>`;
}
