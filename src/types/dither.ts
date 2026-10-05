export type DitherCategory = 
  | 'DIFFUSION' 
  | 'ORDERED' 
  | 'HALFTONE' 
  | 'MODULATION' 
  | 'PATTERN' 
  | 'OTHER';

export interface AlgorithmDef {
  id: number;
  name: string;
  category: DitherCategory;
  kind: 'ERROR' | 'BAYER' | 'BLUE' | 'IGN' | 'WHITE' | 'SCREEN';
  param: number; // kernel id, bayer size, or spot function id
  cell?: number;
  angle?: number;
  description: string;
  isSerpentineDefault?: boolean;
}

export type DitherColorMode = 'monochrome' | 'rgb';

export interface DitherParams {
  algoId: number;
  mode: DitherColorMode; // Monochrome (B&W) or Preserve RGB
  dpi: number;
  scale: number;
  threshold: number; // 0..100 (Threshold / Density bias)
  amount: number;    // Master Dot Density (0..100%): controls number of dots, NOT opacity!
  whiteAmount: number; // 0..100%: density/count of white dots
  blackAmount: number; // 0..100%: density/count of black dots
  spread: number;    // Strength/Spread 0..200
  patternScale: number; // 25..300
  patternAngle: number; // -180..180
  contrast: number;  // 50..200 (100 nominal)
  brightness: number; // -50..50 (0 nominal)
  noise: number;     // 0..100 (Randomness / Jitter)
  serpentine: boolean;
  pixelate: boolean;
  seed: number;
}

export interface LinesParams {
  enabled: boolean;
  amount: number;             // Strand Count
  length: number;             // Strand Length in px
  lengthRand: number;         // Length Randomness (%)
  width: number;              // Strand Thickness (px)
  widthRand: number;          // Thickness Randomness (%)
  direction: 'along' | 'perp' | 'custom' | 'random';
  directionAngle: number;     // Direction angle (deg)
  directionRand: number;      // Direction randomness (0..180 deg)
  colorMode: 'white' | 'black' | 'custom' | 'sampled' | 'random';
  color: string;              // Custom Color hex
  colorRand: number;          // Color randomness (%)
  opacity: number;            // Opacity (%)
  motion: boolean;            // Motion / Auto Animate
  motionSpeed: number;        // Motion Speed (%)
  motionRand: number;         // Motion Randomness (%)
  
  // Object Contours
  objectMode: boolean;        // [ ] Object checkbox: When checked, strictly hugs contours with ZERO gap
  edgeThreshold: number;      // Edge threshold (%)
  edgeSensitivity: number;    // Edge sensitivity (%)
  edgeOffset: number;         // Edge Offset (px), default 0 = strictly glued to edge!

  // Hand Made Lines
  handMade: boolean;          // [ ] Hand Made Lines checkbox
  curve: number;              // Curve slider (0..100): only active when handMade is true!

  // Duplicate Lines
  duplicate: boolean;         // [ ] Duplicate Lines checkbox
  duplicateCount: number;     // 1..4 companion parallel lines
  duplicateOffset: number;    // Offset spacing (px), default 2.0px
  duplicateLength: number;    // Duplicate length scale (%)
  duplicateWidth: number;     // Duplicate thickness (px)
  duplicateOpacity: number;   // Duplicate opacity (%)
}
