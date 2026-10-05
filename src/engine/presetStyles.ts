import { PresetStyle } from '../types/dither';

export const PRESET_STYLES: PresetStyle[] = [
  {
    id: 'gameboy',
    name: 'Game Boy DMG-01',
    category: 'Vintage Hardware',
    description: 'Bayer 4x4 ordered matrix with nostalgic olive-green LCD palette.',
    params: {
      algoId: 16, // Bayer 4x4
      renderMode: 'color_grade',
      colorspace: 'indexed',
      palettePreset: 'gameboy-dmg',
      indexedColorCount: 4,
      scale: 3,
      dpi: 100,
      contrast: 130,
      brightness: 10,
    }
  },
  {
    id: 'macintosh-1984',
    name: '1984 Mac OS 1-Bit',
    category: 'Vintage Hardware',
    description: 'Bill Atkinson’s iconic error diffusion algorithm with crisp 1-bit pixels.',
    params: {
      algoId: 4, // Atkinson
      renderMode: 'monochrome',
      scale: 1,
      dpi: 300,
      contrast: 125,
      brightness: 5,
      levels: { blackClip: 0, shadow: 15, mid: 1.1, highlight: 240, whiteClip: 255 }
    }
  },
  {
    id: 'newspaper-halftone',
    name: 'Newspaper Print 45°',
    category: 'Print & Halftone',
    description: 'Traditional 45-degree angled round dot halftone with high dynamic range.',
    params: {
      algoId: 24, // Halftone 45
      renderMode: 'tonal',
      tonalCount: 1,
      highlightColor: '#111317',
      backgroundColor: '#f3eedf',
      knockoutBg: false,
      scale: 4,
      dpi: 300,
      contrast: 120,
      strength: 110,
      sharpenStrength: 40,
    }
  },
  {
    id: 'risograph-3color',
    name: 'Risograph Fluorescent 3-Tone',
    category: 'Print & Halftone',
    description: 'Multi-pass studio risograph with separate fluorescent inks and knocked-out substrate.',
    params: {
      algoId: 22, // Halftone
      renderMode: 'tonal',
      tonalCount: 3,
      highlightColor: '#ffe800',
      midtoneColor: '#ff2a85',
      shadowColor: '#0052cc',
      backgroundColor: '#ffffff',
      knockoutBg: true,
      scale: 5,
      dpi: 300,
      highlightThreshold: 170,
      midtoneThreshold: 90,
      shadowThreshold: 40,
    }
  },
  {
    id: 'xerox-fanzine',
    name: 'Photocopy Zine (Xerox)',
    category: 'Print & Halftone',
    description: 'High-contrast edge boosted photocopy toner diffusion with raw analog grain.',
    params: {
      algoId: 14, // Xerox Grain
      renderMode: 'monochrome',
      scale: 2,
      dpi: 300,
      contrast: 160,
      sharpenStrength: 80,
      noise: 25,
      amount: 100,
      whiteAmount: 100,
      blackAmount: 100,
    }
  },
  {
    id: 'cyberpunk-matrix',
    name: 'Cyberpunk Matrix CRT',
    category: 'Futuristic',
    description: 'Sub-pixel CRT matrix phosphor screen with electric neon cyan and violet.',
    params: {
      algoId: 25, // Matrix
      renderMode: 'color_grade',
      colorspace: 'indexed',
      palettePreset: 'cyberpunk-neon',
      indexedColorCount: 5,
      scale: 3,
      dpi: 200,
      contrast: 140,
      sharpenStrength: 50,
    }
  },
  {
    id: 'copperplate-engraving',
    name: 'Copperplate Engraving',
    category: 'Print & Halftone',
    description: '+45 deg diagonal line screen simulating classic currency and fine art etchings.',
    params: {
      algoId: 33, // Tilt Modulation
      renderMode: 'tonal',
      tonalCount: 2,
      highlightColor: '#1d1916',
      shadowColor: '#4a382c',
      backgroundColor: '#f5efe4',
      knockoutBg: false,
      scale: 4,
      dpi: 300,
      contrast: 125,
    }
  },
  {
    id: 'blue-noise-stipple',
    name: 'Isotropic Blue Noise Stipple',
    category: 'Fine Art',
    description: 'Smooth, mathematically optimal high-frequency stippling with zero clumping artifacts.',
    params: {
      algoId: 19, // Blue Noise
      renderMode: 'monochrome',
      scale: 1,
      dpi: 300,
      contrast: 110,
      levelsCount: 2,
      amount: 100,
    }
  },
  {
    id: 'commodore-64',
    name: 'Commodore 64 Palette',
    category: 'Vintage Hardware',
    description: 'Bayer 8x8 with authentic 16-color C64 fixed palette reduction.',
    params: {
      algoId: 17, // Bayer 8x8
      renderMode: 'color_grade',
      colorspace: 'indexed',
      palettePreset: 'commodore-64',
      indexedColorCount: 16,
      scale: 4,
      dpi: 100,
      contrast: 115,
    }
  }
];
