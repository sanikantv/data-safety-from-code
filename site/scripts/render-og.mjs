// Renders the Open Graph cards (public/og/*.png, 1200x630), the GitHub social preview
// (../art/social-preview.png, 1280x640), the README banner (../art/readme-banner.png, 1280x400) and
// the how-it-works diagram (../art/how-it-works.png) with headless Chrome. Set in Google Sans Flex
// from public/fonts, icons in Material Symbols Rounded (a subset fetched from Google Fonts and cached
// in the OS temp dir), colours from ../art/palette.json, logo from gen-logo.mjs.
// Run from site/: node scripts/render-og.mjs  (CHROME=/path/to/chrome to override)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icon } from './gen-logo.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const art = fileURLToPath(new URL('../../art/', import.meta.url));
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const { light: c } = JSON.parse(readFileSync(`${art}palette.json`, 'utf8'));
const work = join(tmpdir(), 'data-safety-og');
mkdirSync(work, { recursive: true });

// Every Material Symbols name used below, sorted (Google Fonts wants icon_names in order).
const ICONS = ['arrow_forward', 'bug_report', 'check_circle', 'code', 'csv', 'description', 'location_on', 'package_2', 'rate_review', 'smartphone', 'touch_app', 'upload_file'];
const symbols = join(work, `material-symbols-${ICONS.length}.woff2`);
if (!existsSync(symbols)) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${ICONS.join(',')}&display=block`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' } },
  ).then((r) => r.text());
  const url = css.match(/src: url\((https:[^)]+)\)/)?.[1];
  if (!url) throw new Error(`Google Fonts returned no font URL:\n${css}`);
  writeFileSync(symbols, Buffer.from(await fetch(url).then((r) => r.arrayBuffer())));
}

const ms = (name, cls = '') => `<span class="ms ${cls}">${name}</span>`;
const SITE = 'datasafety.sanikant.dev';
const CHIPS = ['Evidence for every answer', 'Draft for review', 'MIT'];

// The right-hand panel on the cards: a few rows of what the skill finds, real Play CSV IDs and SDKs.
const PANELS = {
  findings: {
    head: ['csv', 'data_safety.csv'],
    rows: [
      ['location_on', 'Approximate location', 'WeatherRepo.kt:42'],
      ['smartphone', 'Device or other IDs', 'play-services-ads'],
      ['bug_report', 'Crash logs', 'firebase-crashlytics'],
    ],
  },
  sdk: {
    head: ['package_2', 'build.gradle.kts'],
    rows: [
      ['smartphone', 'play-services-ads', 'Device or other IDs'],
      ['bug_report', 'firebase-crashlytics', 'Crash logs'],
      ['touch_app', 'firebase-analytics', 'App interactions'],
    ],
  },
  reference: {
    head: ['csv', 'Question IDs'],
    rows: [
      ['location_on', 'PSL_APPROX_LOCATION', 'Location / Approximate location'],
      ['smartphone', 'PSL_DEVICE_ID', 'Device or other IDs'],
      ['bug_report', 'PSL_CRASH_LOGS', 'App info and performance'],
    ],
  },
  guides: {
    head: ['description', 'From code to Console'],
    rows: [
      ['code', 'Scan the project', 'Manifest, Gradle, source'],
      ['rate_review', 'Review the findings', 'Each with file:line'],
      ['upload_file', 'Import the CSV', 'Play Console, Data safety'],
    ],
  },
};

const CARDS = {
  home: { eyebrow: 'Agent skill for Android apps on Google Play', title: 'Data safety form,<br><em>filled from your code</em>', panel: 'findings' },
  guides: { eyebrow: 'Guides', title: 'Fill the Data safety<br>form <em>with evidence</em>', panel: 'guides' },
  sdk: { eyebrow: 'SDK reference', title: 'What your SDKs<br><em>collect and share</em>', panel: 'sdk' },
  reference: { eyebrow: 'Reference', title: 'The Play Console<br><em>Data safety CSV</em>', panel: 'reference' },
  docs: { eyebrow: 'Documentation', title: 'Data safety form,<br><em>filled from your code</em>', panel: 'findings' },
  social: { eyebrow: 'Open-source agent skill for Android apps', title: 'Data safety form,<br><em>filled from your code</em>', panel: 'findings', w: 1280, h: 640, out: `${art}social-preview.png` },
};

const base = (w, h) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Google Sans Flex';src:url('file://${root}public/fonts/google-sans-flex-latin.woff2') format('woff2');font-weight:1 1000;font-stretch:25% 151%}
@font-face{font-family:'Material Symbols Rounded';src:url('file://${symbols}') format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;overflow:hidden;background:${c.surface};font-family:'Google Sans Flex';color:${c.onSurface};position:relative}
.ms{font-family:'Material Symbols Rounded';font-weight:400;font-style:normal;line-height:1;letter-spacing:normal;white-space:nowrap;font-feature-settings:'liga';-webkit-font-smoothing:antialiased;display:inline-block}
.brand{display:flex;align-items:center;gap:16px;font-size:28px;font-weight:600}
.brand svg{width:52px;height:52px}
.eyebrow{display:inline-block;padding:9px 20px;border-radius:999px;background:${c.secondaryContainer};color:${c.onSecondaryContainer};font-size:22px;font-weight:600}
h1{font-weight:700;letter-spacing:-1px;line-height:1.06}
h1 em{font-style:normal;color:${c.primary}}
.chips{display:flex;gap:12px;font-size:21px;font-weight:600;color:${c.onSurfaceVariant}}
.chip{padding:8px 16px;border-radius:10px;background:${c.surfaceContainerLowest};border:1.5px solid ${c.outlineVariant}}
.panel{background:${c.surfaceContainerLowest};border:1.5px solid ${c.outlineVariant};border-radius:24px;padding:22px 24px 10px}
.panel .head{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:600;color:${c.onSurfaceVariant};padding-bottom:16px;border-bottom:1.5px solid ${c.outlineVariant}}
.panel .head .ms{font-size:26px;color:${c.primary}}
.row{display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1.5px solid ${c.surfaceContainerHigh}}
.row:last-child{border-bottom:0}
.row .tile{width:48px;height:48px;border-radius:14px;background:${c.primaryContainer};color:${c.onPrimaryContainer};display:flex;align-items:center;justify-content:center;flex:none}
.row .tile .ms{font-size:28px}
.row b{display:block;font-size:22px;font-weight:600;line-height:1.2}
.row small{display:block;font-size:18px;font-weight:500;color:${c.onSurfaceVariant};margin-top:3px}
</style></head><body>`;

const brand = `<div class="brand">${icon}data-safety-from-code</div>`;
const chips = (list) => `<div class="chips">${list.map((t) => `<span class="chip">${t}</span>`).join('')}</div>`;
const panel = ({ head, rows }) => `<div class="panel"><div class="head">${ms(head[0])}${head[1]}</div>${rows
  .map(([i, b, s]) => `<div class="row"><div class="tile">${ms(i)}</div><div><b>${b}</b><small>${s}</small></div></div>`).join('')}</div>`;

const card = ({ eyebrow, title, panel: p, w = 1200, h = 630 }) => `${base(w, h)}<style>
.card{position:absolute;inset:28px;border-radius:48px;background:${c.surfaceContainer};padding:52px 64px 50px;display:flex;flex-direction:column;justify-content:space-between}
.eyebrow{margin-top:26px}
h1{font-size:60px;max-width:${w - 600}px}
.side{position:absolute;right:68px;top:50%;transform:translateY(-50%);width:400px}
</style>
<div class="card">
  <div>${brand}<div class="eyebrow">${eyebrow}</div></div>
  <h1>${title}</h1>
  ${chips([...CHIPS, SITE])}
</div>
<div class="side">${panel(PANELS[p])}</div>
</body></html>`;

const banner = () => `${base(1280, 400)}<style>
.wrap{position:absolute;inset:0;padding:56px 64px;display:flex;gap:56px;align-items:center}
.logo svg{width:168px;height:168px;display:block}
.text{flex:1;display:flex;flex-direction:column;gap:18px}
h1{font-size:50px;white-space:nowrap}
p{font-size:23px;line-height:1.4;color:${c.onSurfaceVariant};max-width:860px}
.chips{margin-top:6px}
.chips .site{margin-left:auto;align-self:center;color:${c.primary}}
</style>
<div class="wrap">
  <div class="logo">${icon}</div>
  <div class="text">
    <h1>Data safety form, <em>filled from your code</em></h1>
    <p>An agent skill that reads your Android project and writes the CSV that Play Console imports for the Data safety form, with a file:line source behind every answer.</p>
    ${chips(CHIPS).replace('</div>', `<span class="site">${SITE}</span></div>`)}
  </div>
</div>
</body></html>`;

// Four columns: code → findings → CSV → Play Console. Examples use real Play CSV IDs and real SDKs.
const diagram = () => {
  const col = (n, title, sub, body) => `<div class="col"><div class="step"><span class="n">${n}</span>${title}</div><div class="sub">${sub}</div>${body}</div>`;
  const item = (i, b, s, cls = '', tok = '') => `<div class="item ${cls}"><div class="tile">${ms(i)}</div><div><b>${b}</b><small>${s}</small>${tok && `<small class="tok">${tok}</small>`}</div></div>`;
  const arrow = `<div class="arrow">${ms('arrow_forward')}</div>`;
  const csvRow = (q, v) => `<tr><td>${q}</td><td>${v}</td></tr>`;
  return `${base(1800, 664)}<style>
body{padding:56px 64px}
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px}
header h1{font-size:44px}
.cols{display:flex;align-items:stretch;gap:0}
.col{flex:1;min-width:0;background:${c.surfaceContainer};border-radius:28px;padding:26px 22px}
.step{display:flex;align-items:center;gap:12px;font-size:26px;font-weight:700}
.n{width:34px;height:34px;border-radius:999px;background:${c.primary};color:${c.onPrimary};font-size:19px;font-weight:700;display:flex;align-items:center;justify-content:center}
.sub{font-size:19px;font-weight:500;color:${c.onSurfaceVariant};margin:8px 0 20px 46px}
.item{display:flex;align-items:center;gap:14px;background:${c.surfaceContainerLowest};border:1.5px solid ${c.outlineVariant};border-radius:18px;padding:13px 14px;margin-bottom:12px}
.item .tile{width:44px;height:44px;border-radius:12px;background:${c.primaryContainer};color:${c.onPrimaryContainer};display:flex;align-items:center;justify-content:center;flex:none}
.item .tile .ms{font-size:26px}
.item.alt .tile{background:${c.tertiaryContainer};color:${c.onTertiaryContainer}}
.item b{display:block;font-size:20px;font-weight:600;line-height:1.2}
.item small{display:block;font-size:16px;font-weight:500;color:${c.onSurfaceVariant};margin-top:3px;white-space:nowrap}
.item small.tok{color:${c.onTertiaryContainer};font-weight:600;margin-top:1px}
.arrow{flex:none;width:44px;display:flex;align-items:center;justify-content:center;color:${c.primary}}
.arrow .ms{font-size:36px}
.sheet{background:${c.surfaceContainerLowest};border:1.5px solid ${c.outlineVariant};border-radius:18px;overflow:hidden}
.sheet .name{display:flex;align-items:center;gap:8px;padding:12px 16px;font-size:18px;font-weight:600;border-bottom:1.5px solid ${c.outlineVariant}}
.sheet .name .ms{font-size:24px;color:${c.primary}}
table{border-collapse:collapse;width:100%;font-size:15.5px}
th{text-align:left;font-weight:600;color:${c.onSurfaceVariant};background:${c.surfaceContainerLow};padding:9px 16px}
td{padding:11px 16px;border-top:1.5px solid ${c.surfaceContainerHigh};font-weight:500}
td:last-child,th:last-child{text-align:right;color:${c.primary};font-weight:600}
.console{background:${c.surfaceContainerLowest};border:1.5px solid ${c.outlineVariant};border-radius:18px;padding:18px}
.crumb{font-size:16px;font-weight:500;color:${c.onSurfaceVariant}}
.crumb b{color:${c.onSurface};font-weight:600}
.btn{display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:10px 18px;border-radius:999px;background:${c.primary};color:${c.onPrimary};font-size:18px;font-weight:600}
.btn .ms{font-size:22px}
.note{display:flex;gap:10px;align-items:flex-start;margin-top:14px;padding:14px 16px;border-radius:18px;background:${c.secondaryContainer};color:${c.onSecondaryContainer};font-size:17px;font-weight:500;line-height:1.35}
.note .ms{font-size:24px;margin-top:-1px}
</style>
<header><h1>How <em>data-safety-from-code</em> works</h1>${brand.replace('data-safety-from-code', SITE)}</header>
<div class="cols">
${col(1, 'Your code', 'What the agent reads', [
  item('description', 'AndroidManifest.xml', 'Permissions and components'),
  item('package_2', 'build.gradle.kts', 'SDK dependencies'),
  item('code', 'Kotlin and Java source', 'API calls that touch user data'),
].join(''))}
${arrow}
${col(2, 'Findings', 'Each answer cites file:line', [
  item('location_on', 'Approximate location', 'WeatherRepo.kt:42', 'alt', 'sent to your API'),
  item('smartphone', 'Device or other IDs', 'build.gradle.kts', 'alt', 'play-services-ads'),
  item('bug_report', 'Crash logs', 'build.gradle.kts', 'alt', 'firebase-crashlytics'),
].join(''))}
${arrow}
${col(3, 'CSV', 'Play\'s own import format', `<div class="sheet"><div class="name">${ms('csv')}data_safety.csv</div><table>
<tr><th>Response ID</th><th>Value</th></tr>
${csvRow('PSL_APPROX_LOCATION', 'true')}${csvRow('PSL_DEVICE_ID', 'true')}${csvRow('PSL_CRASH_LOGS', 'true')}
</table></div>`)}
${arrow}
${col(4, 'Play Console', 'You review, then save', `<div class="console"><div class="crumb">App content · <b>Data safety</b></div>
<div class="btn">${ms('upload_file')}Import to CSV</div></div>
<div class="note">${ms('rate_review')}<span>A draft for review: check each answer against its evidence before you save.</span></div>`)}
</div>
</body></html>`;
};

const shoot = (name, html, w, h, out) => {
  const file = join(work, `${name}.html`);
  writeFileSync(file, html);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--force-device-scale-factor=1',
    '--virtual-time-budget=3000', `--window-size=${w},${h}`, `--screenshot=${out}`, `file://${file}`,
  ], { stdio: 'ignore' });
  console.log(`rendered ${out.replace(fileURLToPath(new URL('../..', import.meta.url)), '')}`);
};

mkdirSync(`${root}public/og`, { recursive: true });
for (const [name, cfg] of Object.entries(CARDS)) {
  shoot(name, card(cfg), cfg.w ?? 1200, cfg.h ?? 630, cfg.out ?? `${root}public/og/${name}.png`);
}
shoot('readme-banner', banner(), 1280, 400, `${art}readme-banner.png`);
shoot('how-it-works', diagram(), 1800, 664, `${art}how-it-works.png`);
