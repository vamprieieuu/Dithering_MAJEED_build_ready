export interface PalettePreset {
  id: string;
  name: string;
  category: 'Photoshop DTP' | 'Vintage Hardware' | 'Print & Risograph' | 'Aesthetic';
  colors: string[];
}

export const PALETTE_PRESETS: PalettePreset[] = [
  // Original Plugin Presets
  {
    id: 'classic-faded',
    name: 'Classic Faded',
    category: 'Photoshop DTP',
    colors: ['#1c1a24', '#39384d', '#635c6e', '#9b8f88', '#d0bcab', '#ece2d8']
  },
  {
    id: 'retro-warm',
    name: 'Retro Warm',
    category: 'Photoshop DTP',
    colors: ['#1d1314', '#512629', '#914333', '#d97645', '#f2ae6b', '#f9e8b7']
  },
  {
    id: 'retro-print',
    name: 'Retro Print',
    category: 'Photoshop DTP',
    colors: ['#121820', '#1c3e4f', '#2f7478', '#69ab8e', '#bfe09b', '#faf3cf']
  },
  {
    id: 'retro-balanced',
    name: 'Retro Balanced',
    category: 'Photoshop DTP',
    colors: ['#221e20', '#4a3d46', '#875b63', '#be8170', '#e3b58f', '#fae5be']
  },
  {
    id: 'retro-bright',
    name: 'Retro Bright',
    category: 'Photoshop DTP',
    colors: ['#1a102f', '#441d6b', '#912d8a', '#de4c6b', '#f78c52', '#ffd97d']
  },
  {
    id: 'retro-dark',
    name: 'Retro Dark',
    category: 'Photoshop DTP',
    colors: ['#0d0c11', '#1e1b29', '#37324c', '#5a5073', '#86769e', '#b8a6cc']
  },
  {
    id: 'retro-faded',
    name: 'Retro Faded',
    category: 'Photoshop DTP',
    colors: ['#2b2b2b', '#4d4b4a', '#787673', '#a8a6a0', '#d8d4cb', '#f2efe9']
  },
  {
    id: 'retro-red',
    name: 'Retro Red',
    category: 'Photoshop DTP',
    colors: ['#190b0d', '#421217', '#781c25', '#b52f36', '#e65c52', '#fca38c']
  },
  {
    id: 'retro-saturation',
    name: 'Retro Saturation',
    category: 'Photoshop DTP',
    colors: ['#0f051d', '#2c1254', '#601986', '#b0217a', '#f5434d', '#ffab38']
  },
  {
    id: 'classic-bright',
    name: 'Classic Bright',
    category: 'Photoshop DTP',
    colors: ['#111625', '#1e385c', '#2c6b99', '#44a5cf', '#7de0e6', '#e0ffff']
  },
  {
    id: 'classic-linear',
    name: 'Classic Linear',
    category: 'Photoshop DTP',
    colors: ['#080808', '#343434', '#686868', '#9e9e9e', '#cfcfcf', '#ffffff']
  },
  {
    id: 'classic-ramped',
    name: 'Classic Ramped',
    category: 'Photoshop DTP',
    colors: ['#180e29', '#3a205d', '#74348a', '#b75196', '#e88391', '#fcd5b8']
  },
  {
    id: 'classic-vibrant',
    name: 'Classic Vibrant',
    category: 'Photoshop DTP',
    colors: ['#0e1726', '#1a3966', '#2173a8', '#35bae0', '#76f5ce', '#f7ffb2']
  },

  // Vintage Hardware
  {
    id: 'gameboy-dmg',
    name: 'Game Boy Original (DMG)',
    category: 'Vintage Hardware',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
  },
  {
    id: 'gameboy-pocket',
    name: 'Game Boy Pocket',
    category: 'Vintage Hardware',
    colors: ['#282c1e', '#5a6249', '#96a07e', '#c8d4ac']
  },
  {
    id: 'cga-palette1',
    name: 'IBM CGA Mode 1',
    category: 'Vintage Hardware',
    colors: ['#000000', '#55ffff', '#ff55ff', '#ffffff']
  },
  {
    id: 'commodore-64',
    name: 'Commodore 64 (16)',
    category: 'Vintage Hardware',
    colors: [
      '#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55',
      '#0000aa', '#eeee77', '#dd8855', '#664400', '#ff7777', '#333333',
      '#777777', '#aaff66', '#0088ff', '#bbbbbb'
    ]
  },
  {
    id: 'apple-mac-1bit',
    name: 'Macintosh 1984 (1-Bit)',
    category: 'Vintage Hardware',
    colors: ['#000000', '#ffffff']
  },
  {
    id: 'amber-crt',
    name: 'Amber Phosphor CRT',
    category: 'Vintage Hardware',
    colors: ['#0a0800', '#3b2500', '#7a4e00', '#bf7d00', '#ffb000', '#ffdf80']
  },

  // Print & Risograph
  {
    id: 'risograph-3tone',
    name: 'Risograph Fluorescent',
    category: 'Print & Risograph',
    colors: ['#12131a', '#ff48b0', '#0078bf', '#ffe800', '#f4ede2']
  },
  {
    id: 'newspaper-aged',
    name: 'Newspaper Print & Newsprint',
    category: 'Print & Risograph',
    colors: ['#181a1c', '#3c4043', '#72777d', '#b8b5a8', '#ece5d3']
  },
  {
    id: 'cyanotype-blueprint',
    name: 'Cyanotype Sunprint',
    category: 'Print & Risograph',
    colors: ['#031024', '#0d2d59', '#1a528e', '#3c84be', '#88c2e6', '#eaf5fc']
  },

  // Aesthetic
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    category: 'Aesthetic',
    colors: ['#070712', '#ff0055', '#7900ff', '#00e5ff', '#ffe600']
  },
  {
    id: 'synthwave-sunset',
    name: 'Synthwave 84',
    category: 'Aesthetic',
    colors: ['#180b2c', '#461358', '#861b78', '#d63384', '#f77f00', '#fcbf49']
  },
  {
    id: 'matrix-terminal',
    name: 'Matrix Digital Rain',
    category: 'Aesthetic',
    colors: ['#030f06', '#072b12', '#0f6828', '#20c24c', '#55ff7f', '#dffff0']
  }
];

export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
