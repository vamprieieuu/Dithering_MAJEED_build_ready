export type DitherCategory = 'diffusion' | 'ordered' | 'screens' | 'stochastic';

export interface DitherAlgoDefinition {
  id: number;
  name: string;
  category: DitherCategory;
  kind: 'error' | 'bayer' | 'blue' | 'ign' | 'white' | 'screen';
  param: number;
  cell: number;
  angle: number;
  description: string;
}

export type ColorMode = 
  | 'rgb'          // 0: Preserve Original Colors (RGB 3-channel)
  | 'mono'         // 1: Monochrome (B&W)
  | 'duo'          // 2: Custom Duo-Tone
  | 'cmyk'         // 3: CMYK Angled Halftone Separation (15, 75, 0, 45 deg)
  | 'tritone'      // 4: Tonal Tri-Tone Ramp (Shadow / Mid / Highlight)
  | 'indexed';     // 5: Indexed Color Palette reduction

export interface DitherSettings {
  algo: number;
  mode: ColorMode;
  levels: number;           // 2..64 tones
  scale: number;            // 1..32 px size
  threshold: number;        // 0..100 (50 is neutral)
  amount: number;           // Master dot density / coverage (0..100%)
  whiteAmount: number;      // White dot density in mono (0..100%)
  blackAmount: number;      // Black dot density in mono (0..100%)
  strength: number;         // Spread / contrast (0..200%)
  patternScale: number;     // 25..400%
  patternAngle: number;     // 0..360 deg
  contrast: number;         // 0..300%
  brightness: number;       // -100..100
  noise: number;            // Randomness / jitter (0..100%)
  serpentine: boolean;
  linear: boolean;
  invert: boolean;
  pixelate: boolean;
  darkColor: string;        // Hex: #000000
  lightColor: string;       // Hex: #ffffff
  midColor: string;         // Hex: #808080
  selectedPalette: string;  // key of preset palette
  customPalette: string[];  // list of hex colors
  // Preprocessing
  sharpenStrength: number;  // 0..200
  sharpenRadius: number;    // 0..10
  preBlur: number;          // 0..20
  preNoise: number;         // -25..50
  // Lines overlay
  enableLines: boolean;
  linesAmount: number;      // 0..2000
  lineLength: number;       // 2..200 px
  lineLengthRand: number;   // 0..100%
  lineWidth: number;        // 0.2..10 px
  lineColor: string;
  lineOpacity: number;      // 0..100%
  lineObjectMode: boolean;  // Strict contour following
  lineEdgeThreshold: number;// 1..100
  lineHandMade: boolean;
  lineCurve: number;        // 0..100
  lineDuplicate: boolean;
  lineDuplicateCount: number;// 1..4
  lineDuplicateOffset: number;// px
}

export interface Preset {
  id: string;
  name: string;
  category: string;
  description: string;
  settings: Partial<DitherSettings>;
}
