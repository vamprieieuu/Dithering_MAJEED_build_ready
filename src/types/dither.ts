export type DitherCategory = 
  | 'DIFFUSION' 
  | 'MODULATION' 
  | 'SIERRA' 
  | 'HALFTONE' 
  | 'MOSAIC' 
  | 'PATTERN' 
  | 'BAYER' 
  | 'NOISE' 
  | 'OTHER';

export interface AlgorithmDef {
  id: number;
  name: string;
  category: DitherCategory;
  kind: 'error' | 'bayer' | 'blue' | 'ign' | 'white' | 'screen';
  param: number;
  cell?: number;
  angle?: number;
  desc: string;
}

export type RenderMode = 'tonal' | 'color_grade' | 'monochrome' | 'cmyk' | 'duotone';

export type TonalCount = 1 | 2 | 3;

export type Colorspace = 'gray' | 'rgb' | 'indexed';

export interface RGBColor {
  r: number; // 0..1
  g: number; // 0..1
  b: number; // 0..1
}

export interface LevelsConfig {
  blackClip: number; // 0..255 (default 0)
  shadow: number;    // 0..255 (default 0)
  mid: number;       // 0.1..3.0 gamma (default 1.0)
  highlight: number; // 0..255 (default 255)
  whiteClip: number; // 0..255 (default 255)
}

export interface ContourLinesConfig {
  enabled: boolean;
  amount: number;         // 50..1200 strands
  length: number;         // 10..200 px
  width: number;          // 0.5..4 px
  opacity: number;        // 0..100%
  curvature: number;      // 0..100%
  color: string;          // Hex color
  edgeGuided: boolean;    // Adhere to high contrast edge contours
  duplicate: boolean;     // Add companion parallel offset line
}

export interface DitherParams {
  algoId: number;
  dpi: number;            // 75, 100, 200, 300, 450, 600
  scale: number;          // 1..25
  renderMode: RenderMode;
  
  // Density & Dot Coverage
  amount: number;         // 0..100%
  whiteAmount: number;    // 0..100%
  blackAmount: number;    // 0..100%
  threshold: number;      // 0..100 (50 neutral)
  strength: number;       // spread 0..200%
  contrast: number;       // 0..200%
  brightness: number;     // -100..100%
  levelsCount: number;    // 2..64 quantization levels
  
  // Tonal mode options
  tonalCount: TonalCount; // 1, 2, 3
  highlightThreshold: number; // 0..255
  midtoneThreshold: number;   // 0..255
  shadowThreshold: number;    // 0..255
  highlightColor: string; // Hex
  midtoneColor: string;   // Hex
  shadowColor: string;    // Hex
  backgroundColor: string;// Hex
  knockoutBg: boolean;    // Knockout background transparency
  
  // Color Grade options
  colorspace: Colorspace;
  indexedColorCount: number; // 2..64
  spread: number;         // 0..100%
  palettePreset: string;  // 'retro-warm', 'gameboy', etc.
  customPalette: string[];// array of hex strings
  gradeBias: number;      // 0..100%
  gradeBiasSource: string;// 'retro-warm', 'classic-faded', etc.
  biasStyle: 'soft' | 'screen';
  grainMode: 'grain' | 'fade';
  hue: number;            // -180..180
  saturation: number;     // -100..100
  invert: boolean;        // Invert luminance
  
  // Filter pre-processing
  levels: LevelsConfig;
  sharpenStrength: number;// 0..200
  sharpenRadius: number;  // 0..100
  noise: number;          // -25 (denoise) to +50 (noise)
  blur: number;           // 0..50
  
  // Pattern tweak
  patternScale: number;   // 10..200%
  patternAngle: number;   // -180..180 deg
  serpentine: boolean;
  pixelate: boolean;
  seed: number;
  
  // Lines overlay
  lines: ContourLinesConfig;
}

export interface PresetStyle {
  id: string;
  name: string;
  category: string;
  description: string;
  params: Partial<DitherParams>;
}
