export interface PaletteDefinition {
  id: string;
  name: string;
  category: string;
  colors: string[];
}

export const PRESET_PALETTES: PaletteDefinition[] = [
  {
    id: 'gameboy',
    name: 'Game Boy Classic',
    category: 'Retro Gaming',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  },
  {
    id: 'cga',
    name: 'CGA Mode 1 (Cyan/Magenta)',
    category: 'Retro PC',
    colors: ['#000000', '#55ffff', '#ff55ff', '#ffffff'],
  },
  {
    id: 'c64',
    name: 'Commodore 64 Pepto',
    category: 'Retro PC',
    colors: [
      '#000000', '#68372b', '#70a4b2', '#6f3d86',
      '#588d43', '#352879', '#b8c76f', '#6f4f25',
      '#433900', '#9a6759', '#444444', '#6c6c6c',
      '#9ad284', '#6c5eb5', '#959595', '#ffffff'
    ],
  },
  {
    id: 'apple2',
    name: 'Apple II Hi-Res',
    category: 'Retro PC',
    colors: ['#000000', '#14c000', '#ff44fd', '#1b2aff', '#ff6a00', '#ffffff'],
  },
  {
    id: 'mac1984',
    name: 'Macintosh 1984',
    category: 'Monochrome',
    colors: ['#121212', '#f6f6f4'],
  },
  {
    id: 'amber_crt',
    name: 'Amber Phosphor CRT',
    category: 'Terminals',
    colors: ['#180800', '#4a1e00', '#994a00', '#ff8d00', '#ffbe55'],
  },
  {
    id: 'green_crt',
    name: 'Green P1 Phosphor CRT',
    category: 'Terminals',
    colors: ['#041208', '#0b2b13', '#165e29', '#2ad45a', '#78ff9d'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon Matrix',
    category: 'Stylized',
    colors: ['#0d0221', '#0f084b', '#26408b', '#a6ff00', '#ff007f'],
  },
  {
    id: 'risograph_marine',
    name: 'Risograph Marine & Coral',
    category: 'Print & Zine',
    colors: ['#001a33', '#004c80', '#007cc0', '#ff6b6b', '#ffecec'],
  },
  {
    id: 'newspaper',
    name: 'Newsprint Offset',
    category: 'Print & Zine',
    colors: ['#1c1b18', '#e9e4d6'],
  },
  {
    id: 'thermal',
    name: 'Thermal Receipt Blue-Black',
    category: 'Print & Zine',
    colors: ['#111a2e', '#e2e7ef'],
  },
  {
    id: 'solarized',
    name: 'Solarized Dark',
    category: 'Palette',
    colors: ['#002b36', '#073642', '#268bd2', '#2aa198', '#859900', '#b58900', '#cb4b16', '#dc322f', '#eee8d5', '#fdf6e3'],
  },
  {
    id: 'pico8',
    name: 'PICO-8 Fantasy Console',
    category: 'Retro Gaming',
    colors: [
      '#000000', '#1d2b53', '#7e2553', '#008751',
      '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
      '#ff004d', '#ffa300', '#ffec27', '#00e436',
      '#29adff', '#83769c', '#ff77a8', '#ffccaa'
    ],
  },
];
