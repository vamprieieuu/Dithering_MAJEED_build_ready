export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGBColor {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function luma709(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function colorDistanceSq(c1: RGBColor, c2: RGBColor): number {
  // Redmean perceptual distance
  const rmean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return (
    ((512 + rmean) * dr * dr) / 256 +
    4 * dg * dg +
    ((767 - rmean) * db * db) / 256
  );
}

export function findNearestColorIndex(
  target: RGBColor,
  palette: RGBColor[],
  suppressedIndices: Set<number>
): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    if (suppressedIndices.has(i)) continue;
    const dist = colorDistanceSq(target, palette[i]);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// ------------------------------------------------------------ K-Means Palette Extractor
export function extractPaletteFromImageData(
  imgData: ImageData,
  k: number = 8,
  maxSamples: number = 10000
): string[] {
  const data = imgData.data;
  const totalPixels = imgData.width * imgData.height;
  const step = Math.max(1, Math.floor(totalPixels / maxSamples));
  const samples: RGBColor[] = [];

  for (let i = 0; i < totalPixels; i += step) {
    const idx = i * 4;
    const a = data[idx + 3];
    if (a > 32) {
      samples.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      });
    }
  }

  if (samples.length === 0) {
    return ['#000000', '#ffffff'];
  }

  const actualK = Math.min(k, samples.length);
  // K-means++ initialization
  const centers: RGBColor[] = [];
  centers.push(samples[Math.floor(Math.random() * samples.length)]);

  while (centers.length < actualK) {
    const dists: number[] = [];
    let sumDist = 0;
    for (const sample of samples) {
      let minDist = Infinity;
      for (const center of centers) {
        const d = colorDistanceSq(sample, center);
        if (d < minDist) minDist = d;
      }
      dists.push(minDist);
      sumDist += minDist;
    }

    let r = Math.random() * sumDist;
    let chosenIdx = 0;
    for (let i = 0; i < dists.length; i++) {
      r -= dists[i];
      if (r <= 0) {
        chosenIdx = i;
        break;
      }
    }
    centers.push(samples[chosenIdx]);
  }

  // Iterate 6 passes
  const assignments = new Int32Array(samples.length);
  for (let iter = 0; iter < 6; iter++) {
    // Assign to nearest
    for (let i = 0; i < samples.length; i++) {
      let bestCenter = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = colorDistanceSq(samples[i], centers[c]);
        if (d < bestDist) {
          bestDist = d;
          bestCenter = c;
        }
      }
      assignments[i] = bestCenter;
    }

    // Update centers
    const sums = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let i = 0; i < samples.length; i++) {
      const c = assignments[i];
      sums[c].r += samples[i].r;
      sums[c].g += samples[i].g;
      sums[c].b += samples[i].b;
      sums[c].count++;
    }

    for (let c = 0; c < centers.length; c++) {
      if (sums[c].count > 0) {
        centers[c] = {
          r: sums[c].r / sums[c].count,
          g: sums[c].g / sums[c].count,
          b: sums[c].b / sums[c].count,
        };
      }
    }
  }

  // Sort by luminance (dark to light)
  centers.sort((a, b) => luma709(a.r, a.g, a.b) - luma709(b.r, b.g, b.b));

  return centers.map((c) => rgbToHex(c.r, c.g, c.b));
}

// ------------------------------------------------------------ Preset Palettes
export const PALETTE_PRESETS: Record<string, { name: string; colors: string[] }> = {
  'retro-balanced': {
    name: 'Retro Balanced',
    colors: ['#171219', '#223843', '#d77a61', '#eff1f3', '#dbd3d8'],
  },
  'retro-bright': {
    name: 'Retro Bright',
    colors: ['#0f051d', '#591a75', '#d6249f', '#ff8400', '#ffd000', '#ffffff'],
  },
  'retro-dark': {
    name: 'Retro Dark',
    colors: ['#0d0c1d', '#161b33', '#474973', '#a69cac', '#f1dac4'],
  },
  'retro-faded': {
    name: 'Retro Faded',
    colors: ['#282c37', '#6c7a89', '#95a5a6', '#d2b48c', '#ece0d1'],
  },
  'retro-print': {
    name: 'Retro Print (Cyan/Magenta)',
    colors: ['#121013', '#0099cc', '#e60067', '#ffed00', '#ffffff'],
  },
  'retro-warm': {
    name: 'Retro Warm (Sepia Amber)',
    colors: ['#1c110a', '#542310', '#9b4819', '#e07a38', '#f8d28a'],
  },
  'classic-faded': {
    name: 'Classic Faded',
    colors: ['#1a1c23', '#39424e', '#667788', '#aab7c4', '#e2e8f0'],
  },
  'classic-vibrant': {
    name: 'Classic Vibrant',
    colors: ['#080708', '#3772ff', '#df2935', '#fdca40', '#e6e8e6'],
  },
  'gameboy-original': {
    name: 'GameBoy 1989 (DMG-01)',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  },
  'gameboy-pocket': {
    name: 'GameBoy Pocket (Silver B&W)',
    colors: ['#181818', '#545454', '#a0a0a0', '#e8e8e8'],
  },
  'mac-1bit': {
    name: 'Apple Macintosh 1-Bit',
    colors: ['#000000', '#ffffff'],
  },
  'cga-mode1': {
    name: 'CGA Mode 1 (Cyan/Magenta)',
    colors: ['#000000', '#00aaaa', '#aa00aa', '#aaaaaa'],
  },
  'pico8': {
    name: 'PICO-8 Fantasy Console',
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751',
      '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436',
      '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ],
  },
  'cyberpunk': {
    name: 'Cyberpunk Neon',
    colors: ['#050510', '#1a0033', '#710193', '#e00078', '#00e5ff', '#fffd82'],
  },
  'risograph-duo': {
    name: 'Risograph Fluorescent Duo',
    colors: ['#151020', '#ff0055', '#0066ff', '#f5f5f0'],
  },
  'c64': {
    name: 'Commodore 64 Classic',
    colors: [
      '#000000', '#ffffff', '#880000', '#aaffee',
      '#cc44cc', '#00cc55', '#0000aa', '#eeee77',
      '#dd8855', '#664400', '#ff7777', '#333333',
      '#777777', '#aaff66', '#0088ff', '#bbbbbb'
    ],
  },
};
