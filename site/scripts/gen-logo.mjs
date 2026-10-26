// Builds the icon: a primary (#206A4E) rounded-square tile holding a light shield with three CSV
// rows, the last row a checkmark. Three tones from art/palette.json, drawn on a 48-unit grid so the
// rows stay at least 1px tall at 16px. Writes the SVGs, then renders art/icon-512.png (GitHub
// avatar) with headless Chrome. Run from site/: node scripts/gen-logo.mjs  (CHROME=/path to override)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('..', import.meta.url));
const art = fileURLToPath(new URL('../../art/', import.meta.url));
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TILE = '#206A4E'; // primary, tone 40
const SHIELD = '#E8FFF0'; // primary, tone 98
const ROW = '#589E7E'; // primary, tone 60: the two data rows sit back, the checked row stands out

export const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
<rect width="48" height="48" rx="11" fill="${TILE}"/>
<path d="M24 6.5 37.5 11v11.5c0 9-5.6 15.6-13.5 19.4C16.1 38.1 10.5 31.5 10.5 22.5V11Z" fill="${SHIELD}" stroke="${SHIELD}" stroke-width="2.5" stroke-linejoin="round"/>
<rect x="15.5" y="12.5" width="5" height="4" rx="1.2" fill="${ROW}"/><rect x="22.5" y="12.5" width="10" height="4" rx="1.2" fill="${ROW}"/>
<rect x="15.5" y="18.5" width="5" height="4" rx="1.2" fill="${ROW}"/><rect x="22.5" y="18.5" width="10" height="4" rx="1.2" fill="${ROW}"/>
<path d="m17.5 29.5 4.3 4L30.5 26" fill="none" stroke="${TILE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(`${art}icon.svg`, icon);
  writeFileSync(`${site}src/assets/logo.svg`, icon);
  writeFileSync(`${site}public/favicon.svg`, icon);
  console.log('wrote art/icon.svg, site/src/assets/logo.svg, site/public/favicon.svg');

  const dir = mkdtempSync(join(tmpdir(), 'dsfc-logo-'));
  writeFileSync(join(dir, 'icon.html'), `<!doctype html><style>*{margin:0}body{width:512px;height:512px;background:transparent}svg{display:block;width:512px;height:512px}</style>${icon}`);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
    '--window-size=512,512', `--screenshot=${art}icon-512.png`, `file://${join(dir, 'icon.html')}`,
  ], { stdio: 'ignore' });
  console.log('rendered art/icon-512.png');
}
