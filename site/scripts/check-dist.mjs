// Final QA over dist/: one H1 per page, unique titles and descriptions, canonical and Open Graph
// tags, valid JSON-LD, sitemap coverage, no placeholders, and no broken internal links or media.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = "https://datasafety.sanikant.dev";
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const pages = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'pagefind' && name !== '_astro') walk(p);
    } else if (name === 'index.html') pages.push(p);
  }
};
walk(dist);

const errors = [];
const titles = new Map();
const descriptions = new Map();
const sitemap = readFileSync(join(dist, 'sitemap-0.xml'), 'utf8');
const get = (html, re) => html.match(re)?.[1];

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const route = '/' + relative(dist, file).replace(/index\.html$/, '');
  const is404 = route === '/404/';
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(`${route}: ${h1} <h1> elements`);
  const title = get(html, /<title>([^<]*)<\/title>/);
  const desc = get(html, /<meta name="description" content="([^"]*)"/);
  for (const [map, value, label] of [[titles, title, 'title'], [descriptions, desc, 'description']]) {
    if (!value) errors.push(`${route}: missing ${label}`);
    else if (map.has(value)) errors.push(`${route}: duplicate ${label} with ${map.get(value)}`);
    else map.set(value, route);
  }
  if (desc && (desc.length < 70 || desc.length > 200)) errors.push(`${route}: description is ${desc.length} chars`);
  for (const tag of ['rel="canonical"', 'property="og:title"', 'property="og:description"', 'property="og:image"', 'name="twitter:card"', 'name="author"', 'name="keywords"']) {
    if (!html.includes(tag)) errors.push(`${route}: missing ${tag}`);
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { errors.push(`${route}: invalid JSON-LD`); }
  }
  if (!is404 && !sitemap.includes(`${SITE}${route}<`)) errors.push(`${route}: not in sitemap`);
  if (/\bTODO\b|lorem ipsum|\[PASTE|\{\{/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) errors.push(`${route}: placeholder text`);
  for (const m of html.matchAll(/(?:href|src|poster)="(\/[^"#?]*)/g)) {
    const url = m[1];
    if (url.startsWith('//')) continue;
    const target = join(dist, decodeURIComponent(url));
    if (!existsSync(target) && !existsSync(join(target, 'index.html'))) errors.push(`${route}: broken link ${url}`);
  }
}

console.log(`checked ${pages.length} pages`);
if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  process.exit(1);
}
console.log('all checks passed');
