// Subsets Material Symbols Rounded (Apache 2.0) to the icons this site uses and self-hosts it.
// Scans dist/ for <span class="msr …">name</span>, asks Google Fonts for just those glyphs, and
// writes public/fonts/material-symbols-rounded.woff2 (+ a copy in dist/). The icon list is kept
// next to the font, so the download only happens when the set of icons changes.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const font = fileURLToPath(new URL('../public/fonts/material-symbols-rounded.woff2', import.meta.url));
const list = fileURLToPath(new URL('../public/fonts/material-symbols-rounded.txt', import.meta.url));

const names = new Set();
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) {
      for (const m of readFileSync(p, 'utf8').matchAll(/<span class="msr[^"]*"[^>]*>([a-z0-9_]+)<\/span>/g)) names.add(m[1]);
    }
  }
};
walk(dist);
const wanted = [...names].sort();
const have = existsSync(list) ? readFileSync(list, 'utf8').trim() : '';

if (have !== wanted.join('\n') || !existsSync(font)) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${wanted.join(',')}&display=block`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' } },
  ).then((r) => r.text());
  const url = css.match(/src: url\((https:[^)]+)\)/)?.[1];
  if (!url) throw new Error(`Google Fonts returned no font URL:\n${css}`);
  writeFileSync(font, Buffer.from(await fetch(url).then((r) => r.arrayBuffer())));
  writeFileSync(list, wanted.join('\n') + '\n');
  console.log(`downloaded Material Symbols subset with ${wanted.length} icons`);
} else {
  console.log(`Material Symbols subset up to date (${wanted.length} icons)`);
}
copyFileSync(font, join(dist, 'fonts/material-symbols-rounded.woff2'));
