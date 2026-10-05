export interface StudioStylePreset {
  id: string;
  name: string;
  tagline: string;
  category: string;
  algoId: number;
  mode: 'monochrome' | 'rgb';
  scale: number;
  threshold: number;
  amount: number;
  whiteAmount: number;
  blackAmount: number;
  spread: number;
  patternScale: number;
  contrast: number;
  brightness: number;
  noise: number;
  lines?: boolean;
}

export const STUDIO_STYLE_PRESETS: StudioStylePreset[] = [
  {
    id: 'newspaper-halftone',
    name: 'Newspaper Halftone 45°',
    tagline: 'Classic 45° rotary newspaper screen with natural density balance',
    category: 'Halftone',
    algoId: 24, // Halftone 45
    mode: 'monochrome',
    scale: 4,
    threshold: 50,
    amount: 100,
    whiteAmount: 100,
    blackAmount: 100,
    spread: 110,
    patternScale: 100,
    contrast: 130,
    brightness: 0,
    noise: 0,
    lines: false,
  },
  {
    id: 'atkinson-1bit',
    name: 'Atkinson 1-Bit Mac',
    tagline: 'Ultra-crisp 1984 Macintosh error diffusion with photographic preservation',
    category: 'Diffusion',
    algoId: 4, // Atkinson
    mode: 'monochrome',
    scale: 2,
    threshold: 50,
    amount: 100,
    whiteAmount: 100,
    blackAmount: 100,
    spread: 100,
    patternScale: 100,
    contrast: 140,
    brightness: 5,
    noise: 0,
    lines: false,
  },
  {
    id: 'contour-sketch',
    name: 'Object Contour & Halftone',
    tagline: 'Precision contour lines hugging object edges combined with round dots',
    category: 'Lines + Dither',
    algoId: 22, // Halftone
    mode: 'monochrome',
    scale: 3,
    threshold: 48,
    amount: 85,
    whiteAmount: 100,
    blackAmount: 70,
    spread: 105,
    patternScale: 100,
    contrast: 125,
    brightness: 0,
    noise: 0,
    lines: true,
  },
  {
    id: 'sparse-stipple-floyd',
    name: 'Subtle Stipple Grain',
    tagline: 'Sparse dither density that blends seamlessly into the original photo',
    category: 'Diffusion',
    algoId: 0, // Floyd-Steinberg
    mode: 'monochrome',
    scale: 1,
    threshold: 50,
    amount: 45, // Thinned out density
    whiteAmount: 40,
    blackAmount: 80,
    spread: 100,
    patternScale: 100,
    contrast: 115,
    brightness: 0,
    noise: 0,
    lines: false,
  },
  {
    id: 'crt-slotmask',
    name: 'CRT Slot-Mask RGB',
    tagline: 'Horizontal phosphor beam modulation preserving original colors',
    category: 'Modulation',
    algoId: 30, // Medium Modulation
    mode: 'rgb',
    scale: 3,
    threshold: 50,
    amount: 100,
    whiteAmount: 100,
    blackAmount: 100,
    spread: 100,
    patternScale: 100,
    contrast: 110,
    brightness: 0,
    noise: 0,
    lines: false,
  },
  {
    id: 'xerox-zine',
    name: 'Photocopy Xerox Zine',
    tagline: 'High contrast toner boost with heavy ink line contours',
    category: 'Lines + Dither',
    algoId: 14, // Xerox Grain
    mode: 'monochrome',
    scale: 2,
    threshold: 46,
    amount: 100,
    whiteAmount: 90,
    blackAmount: 100,
    spread: 140,
    patternScale: 100,
    contrast: 160,
    brightness: -5,
    noise: 20,
    lines: true,
  },
  {
    id: 'bayer-8x8',
    name: 'Ordered 8x8 Bayer Matrix',
    tagline: 'Clean geometric ordered dither grid with original color blending',
    category: 'Ordered',
    algoId: 17, // Bayer 8x8
    mode: 'rgb',
    scale: 2,
    threshold: 50,
    amount: 90,
    whiteAmount: 100,
    blackAmount: 100,
    spread: 100,
    patternScale: 100,
    contrast: 120,
    brightness: 0,
    noise: 0,
    lines: false,
  }
];
