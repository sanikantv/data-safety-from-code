// Colors from ../art/palette.json (M3 tonal spot from the Google Play green #01875F) and the fonts.
import { loadFont as loadSansFlex } from '@remotion/google-fonts/GoogleSansFlex';
import { loadFont as loadSansCode } from '@remotion/google-fonts/GoogleSansCode';
import { loadFont as loadLocal } from '@remotion/fonts';
import { staticFile } from 'remotion';

export const { fontFamily: SANS } = loadSansFlex('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });
export const { fontFamily: MONO } = loadSansCode('normal', { weights: ['400', '500', '600'], subsets: ['latin'] });
loadLocal({ family: 'Material Symbols Rounded', url: staticFile('fonts/material-symbols-rounded.woff2'), display: 'block' });

export const C = {
  primary: '#206a4e',
  onPrimary: '#ffffff',
  primaryContainer: '#a9f2cd',
  onPrimaryContainer: '#005138',
  secondaryContainer: '#cfe9d9',
  onSecondaryContainer: '#354b40',
  tertiaryContainer: '#c1e9fb',
  onTertiaryContainer: '#244c5b',
  surface: '#f5fbf5',
  surfaceLowest: '#ffffff',
  surfaceLow: '#eff5ef',
  surfaceContainer: '#eaefe9',
  surfaceHigh: '#e4eae4',
  onSurface: '#171d1a',
  onSurfaceVariant: '#404943',
  outlineVariant: '#bfc9c1',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
};
