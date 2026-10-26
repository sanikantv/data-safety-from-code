// Downloads a Material Symbols Rounded subset (Apache 2.0) with just the icons the video uses.
// Run: npm run icons
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ICONS = [
  'arrow_forward', 'bug_report', 'check', 'check_circle', 'code', 'description', 'help', 'inventory_2', 'link',
  'location_on', 'monitoring', 'policy', 'smartphone', 'table_view', 'terminal', 'touch_app', 'upload_file',
  'verified_user', 'warning', 'folder', 'deployed_code', 'cloud_upload', 'delete', 'star',
].sort();

const css = await fetch(
  `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${ICONS.join(',')}&display=block`,
  { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' } },
).then((r) => r.text());
const url = css.match(/src: url\((https:[^)]+)\)/)?.[1];
if (!url) throw new Error(`Google Fonts returned no font URL:\n${css}`);
const out = fileURLToPath(new URL('../public/fonts/material-symbols-rounded.woff2', import.meta.url));
writeFileSync(out, Buffer.from(await fetch(url).then((r) => r.arrayBuffer())));
console.log(`wrote ${out} (${ICONS.length} icons)`);
