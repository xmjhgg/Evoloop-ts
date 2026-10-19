export type ThemePreference = 'system' | 'light' | 'dark';
export const palettes = {
  light: {
    background: '#F5F6F2',
    surface: '#FFFFFF',
    text: '#20362C',
    muted: '#607369',
    line: '#DCE4DC',
    accent: '#237553',
    tint: '#E5F2E8',
    danger: '#A83232',
  },
  dark: {
    background: '#101B17',
    surface: '#1B2B23',
    text: '#EDF5EF',
    muted: '#ACC0B2',
    line: '#354B3D',
    accent: '#8ED4AA',
    tint: '#294835',
    danger: '#FFB0A8',
  },
} as const;
export type Palette = { readonly [K in keyof typeof palettes.light]: string };
