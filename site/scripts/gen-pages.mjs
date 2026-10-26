// Generates the pages that come straight from the skill, so the site can't drift from it:
//   src/content/docs/sdk/<id>.mdx      one page per entry in knowledge/sdks.json
//   src/content/docs/sdk/index.mdx     the SDK list
//   src/content/docs/reference/csv-format.mdx   every question and response ID in the template
//   src/content/docs/reference/definitions.mdx  from knowledge/definitions.md
//   src/data/sdks.json                 for the home page SDK grid
// Every CSV ID shown on these pages is read from the bundled template. Run: node scripts/gen-pages.mjs
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const skill = `${root}/../skills/data-safety-from-code`;
const docs = `${root}/src/content/docs`;
const sdks = JSON.parse(readFileSync(`${skill}/knowledge/sdks.json`, 'utf8'));

// ---------------------------------------------------------------- template

function parseLine(line) {
  const out = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      let v = '';
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { v += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else v += line[i++];
      }
      out.push(v);
      i++; // comma
    } else {
      const j = line.indexOf(',', i);
      out.push(j === -1 ? line.slice(i) : line.slice(i, j));
      i = j === -1 ? line.length + 1 : j + 1;
    }
  }
  return out;
}
const lines = readFileSync(`${skill}/template/data_safety_template.csv`, 'utf8').split(/\r?\n/).filter(Boolean);
const rows = lines.slice(1).map(parseLine).map(([qid, rid, value, req, label]) => ({ qid, rid, value, req, label }));
const typeRows = rows.filter((r) => r.qid.startsWith('PSL_DATA_TYPES_'));
const has = (qid, rid) => rows.some((r) => r.qid === qid && r.rid === rid);
const typeLabel = (t) => {
  const label = typeRows.find((r) => r.rid === t)?.label ?? t;
  const [cat, name] = label.split(' / ');
  return name && name !== cat ? name : cat;
};
const typeCategory = (t) => (typeRows.find((r) => r.rid === t)?.label ?? '').split(' / ')[0];
const categoryQid = (t) => typeRows.find((r) => r.rid === t)?.qid;
const purposeRows = rows.filter((r) => r.qid.endsWith(':DATA_USAGE_COLLECTION_PURPOSE') && r.qid.includes(':PSL_NAME:'));
const PURPOSES = Object.fromEntries(purposeRows.map((r) => [r.rid, r.label.split(' / ').pop()]));
const purposeName = (p) => PURPOSES[p] ?? p;

// ---------------------------------------------------------------- helpers

const esc = (s = '') => String(s).replace(/[{}<>]/g, (c) => ({ '{': '&#123;', '}': '&#125;', '<': '&lt;', '>': '&gt;' })[c]);
const yaml = (s) => JSON.stringify(String(s));
const CATEGORY = {
  ads: 'Ads', analytics: 'Analytics', crash: 'Crash reporting', auth: 'Sign-in', database: 'Database',
  messaging: 'Messaging and notifications', payments: 'Payments', ml: 'Machine learning', ai: 'Generative AI', other: 'Other',
};
// Names people search for, where the vendor's full name differs.
const SHORT = {
  admob: 'AdMob',
  'firebase-analytics': 'Firebase Analytics',
  'user-messaging-platform': 'Google UMP SDK',
  'google-ai-client-sdk': 'Gemini API (Google AI client SDK)',
  'facebook-sdk': 'Facebook SDK',
  'ml-kit': 'ML Kit',
  'firebase-ai-logic': 'Firebase AI Logic',
  revenuecat: 'RevenueCat',
};
const shortName = (s) => SHORT[s.id] ?? s.name.replace(/\s*\(.*\)$/, '');
const lower = (label) => label.toLowerCase().replace(/\bids\b/, 'IDs');

function csvRowsFor(s) {
  const out = [];
  for (const d of s.data) {
    if (d.condition) continue;
    const t = d.type;
    const u = (q) => `PSL_DATA_USAGE_RESPONSES:${t}:${q}`;
    const push = (qid, rid, v = 'true') => {
      if (!has(qid, rid)) throw new Error(`${s.id}: row ${qid},${rid} is not in the template`);
      out.push(`${qid},${rid},${v}`);
    };
    push(categoryQid(t), t);
    if (d.collected) push(u('PSL_DATA_USAGE_COLLECTION_AND_SHARING'), 'PSL_DATA_USAGE_ONLY_COLLECTED');
    if (d.shared) push(u('PSL_DATA_USAGE_COLLECTION_AND_SHARING'), 'PSL_DATA_USAGE_ONLY_SHARED');
    if (d.collected) push(u('PSL_DATA_USAGE_EPHEMERAL'), '', d.ephemeral === true ? 'true' : 'false');
    for (const p of d.purposes ?? []) {
      if (d.collected) push(u('DATA_USAGE_COLLECTION_PURPOSE'), p);
      if (d.shared) push(u('DATA_USAGE_SHARING_PURPOSE'), p);
    }
  }
  return out;
}

const yn = (b) => (b ? 'Yes' : 'No');

// ---------------------------------------------------------------- SDK pages

rmSync(`${docs}/sdk`, { recursive: true, force: true });
mkdirSync(`${docs}/sdk`, { recursive: true });
mkdirSync(`${root}/src/data`, { recursive: true });

for (const s of sdks) {
  const name = shortName(s);
  const always = s.data.filter((d) => !d.condition);
  const conditional = s.data.filter((d) => d.condition);
  const typesText = [...new Set(always.map((d) => lower(typeLabel(d.type))))];
  const anyShared = always.some((d) => d.shared);
  const official = s.confidence === 'official';
  let description = always.length
    ? `What ${name} collects for the Google Play Data safety form: ${typesText.slice(0, 3).join(', ')}${typesText.length > 3 ? ' and more' : ''}. Purposes, sharing and the exact CSV rows.`
    : `How to declare ${name} in the Google Play Data safety form: what it can collect, when it applies, and the CSV rows to set.`;
  if (description.length > 195) description = `What ${name} collects for the Google Play Data safety form, with purposes, sharing and the exact CSV rows.`;
  const related = sdks.filter((o) => o.id !== s.id && o.category === s.category).slice(0, 4);
  const csv = csvRowsFor(s);

  const body = [];
  body.push('---');
  body.push(`title: ${yaml(`${name}: Data safety form answers`)}`);
  body.push(`description: ${yaml(description)}`);
  body.push('keywords:');
  for (const k of [`${name.toLowerCase()} data safety`, `${name.toLowerCase()} data safety form`, `${name.toLowerCase()} google play data safety`]) body.push(`  - ${yaml(k)}`);
  body.push('---');
  body.push('');
  body.push(`import { Aside } from '@astrojs/starlight/components';`);
  body.push(`import Install from '../../../components/Install.astro';`);
  body.push(`import GuideEnd from '../../../components/GuideEnd.astro';`);
  body.push('');
  body.push(
    `If your Android app includes **${esc(s.name)}**${s.vendor ? ` from ${esc(s.vendor)}` : ''}, its data counts as data your app collects. ` +
      (always.length
        ? `${official ? 'According to the vendor' : 'Based on what the SDK does'}, it ${anyShared ? 'collects and shares' : 'collects'} ` +
          `${typesText.join(', ')}${anyShared ? '' : ' (collected, not shared: the vendor acts as a service provider)'}.`
        : 'What it collects depends on how you use it, so each data type below has a condition.'),
  );
  body.push('');
  body.push(`Matched dependencies: ${s.match.map((m) => `\`${m}\``).join(', ')}.`);
  body.push('');
  if (official) {
    body.push(`<Aside type="tip" title="Source">From ${esc(s.vendor ?? 'the vendor')}'s own Play data disclosure: [${esc(new URL(s.source).hostname)}](${s.source}). Checked ${s.verified}.</Aside>`);
  } else {
    body.push(`<Aside type="caution" title="No official vendor disclosure">This entry is inferred from the SDK's behavior and Google's definitions, not from a vendor data-safety page (see [source](${s.source}), checked ${s.verified}). Check it against your own use of the SDK.</Aside>`);
  }
  body.push('');
  if (always.length) {
    body.push('## What to declare');
    body.push('');
    body.push('| Data type | Collected | Shared | Ephemeral | Purposes |');
    body.push('|---|---|---|---|---|');
    for (const d of always) {
      body.push(`| ${esc(typeLabel(d.type))}${d.what ? ` <br/><small>${esc(d.what)}</small>` : ''} | ${yn(d.collected)} | ${yn(d.shared)} | ${d.ephemeral === true ? 'Yes' : 'No'} | ${esc((d.purposes ?? []).map(purposeName).join('; ') || 'Not stated by the vendor: choose yours')} |`);
    }
    body.push('');
    body.push('Whether each type is **required or optional** for users depends on your app: optional only if users can turn it off and the app honors that.');
    body.push('');
  }
  if (conditional.length) {
    body.push(always.length ? '## Only declare these if they apply' : '## What it can collect');
    body.push('');
    body.push('| Data type | When | Collected | Shared | Purposes |');
    body.push('|---|---|---|---|---|');
    for (const d of conditional) {
      body.push(`| ${esc(typeLabel(d.type))} | ${esc(d.condition)} | ${yn(d.collected)} | ${yn(d.shared)} | ${esc((d.purposes ?? []).map(purposeName).join('; ') || 'Choose yours')} |`);
    }
    body.push('');
    body.push(`The skill lists these under *Needs your review* and checks the code for the condition (for example a \`setUserId\` call) before you include them.`);
    body.push('');
  }
  if (s.notes) {
    body.push('## Notes');
    body.push('');
    body.push(esc(s.notes));
    body.push('');
  }
  if (csv.length) {
    body.push('## The CSV rows this sets');
    body.push('');
    body.push(`These are the rows of Google's [Data safety CSV](/reference/csv-format/) that ${esc(name)} turns to \`true\` (or \`false\` for the ephemeral question). Columns: question ID, response ID, value. You also answer the required/optional row for each type.`);
    body.push('');
    body.push('```csv');
    body.push(...csv);
    body.push('```');
    body.push('');
  }
  body.push('## Detect it automatically');
  body.push('');
  body.push(`\`data-safety-from-code\` finds ${esc(name)} in your \`build.gradle\` or version catalog, adds these answers with a link to the source, and merges them with every other SDK and with what your own code sends. You get a CSV to import and a report showing where each answer comes from.`);
  body.push('');
  body.push('<Install />');
  body.push('');
  if (related.length) {
    body.push(`## Other ${CATEGORY[s.category]?.toLowerCase() ?? ''} SDKs`);
    body.push('');
    for (const r of related) body.push(`- [${esc(shortName(r))} data safety](/sdk/${r.id}/)`);
    body.push('');
  }
  body.push('Related: [collected vs shared](/guides/collected-vs-shared/) · [how to fill the Data safety form](/guides/how-to-fill-data-safety-form/) · [all SDKs](/sdk/)');
  body.push('');
  body.push('<GuideEnd />');
  body.push('');
  writeFileSync(`${docs}/sdk/${s.id}.mdx`, body.join('\n'));
}

// SDK index
{
  const byCat = {};
  for (const s of sdks) (byCat[s.category] ??= []).push(s);
  const b = [
    '---',
    'title: Data safety answers for Android SDKs',
    'description: What Firebase, AdMob, RevenueCat, OneSignal, Sentry, Mixpanel and other Android SDKs collect for the Google Play Data safety form, with sources.',
    'keywords:',
    '  - "android sdk data safety"',
    '  - "sdk data safety form google play"',
    '  - "third party sdk data safety"',
    'tableOfContents: false',
    '---',
    '',
    `Most data an Android app collects comes from its SDKs. Each page below lists what one SDK collects or shares for Google Play's Data safety form, and the exact CSV rows it sets. ${sdks.filter((s) => s.confidence === 'official').length} of the ${sdks.length} entries come from the vendor's own Play data disclosure; the rest are marked as inferred.`,
    '',
    'Missing an SDK? Entries live in [`knowledge/sdks.yaml`](https://github.com/sanikantv/data-safety-from-code/blob/main/skills/data-safety-from-code/knowledge/sdks.yaml): open a pull request with a link to the vendor\'s disclosure page.',
    '',
  ];
  for (const [cat, list] of Object.entries(byCat)) {
    b.push(`## ${CATEGORY[cat] ?? cat}`, '');
    for (const s of list) {
      const types = [...new Set(s.data.filter((d) => !d.condition).map((d) => typeLabel(d.type)))];
      b.push(`- [**${esc(shortName(s))}**](/sdk/${s.id}/): ${types.length ? esc(types.join(', ')) : 'depends on your use'}${s.confidence === 'official' ? '' : ' (inferred)'}`);
    }
    b.push('');
  }
  writeFileSync(`${docs}/sdk/index.mdx`, b.join('\n'));
}

writeFileSync(
  `${root}/src/data/sdks.json`,
  JSON.stringify(
    sdks.map((s) => ({
      id: s.id, name: shortName(s), category: s.category, confidence: s.confidence,
      types: [...new Set(s.data.filter((d) => !d.condition).map((d) => typeLabel(d.type)))],
      shares: s.data.some((d) => !d.condition && d.shared),
    })),
    null, 2,
  ) + '\n',
);

// ---------------------------------------------------------------- reference: CSV format

{
  mkdirSync(`${docs}/reference`, { recursive: true });
  const counts = rows.reduce((m, r) => ((m[r.req] = (m[r.req] ?? 0) + 1), m), {});
  const top = rows.filter((r) => !r.qid.startsWith('PSL_DATA_TYPES_') && !r.qid.startsWith('PSL_DATA_USAGE_RESPONSES'));
  const usage = rows.filter((r) => r.qid.startsWith('PSL_DATA_USAGE_RESPONSES:PSL_NAME:'));
  const b = [
    '---',
    'title: Data safety CSV format and question IDs',
    `description: ${yaml(`The Google Play Data safety CSV explained: its 5 columns, true/false values, answer requirements, and all ${rows.length} question and response IDs.`)}`,
    'keywords:',
    '  - "data safety csv template"',
    '  - "data safety csv format"',
    '  - "play console data safety csv"',
    '---',
    '',
    `Play Console's Data safety form can be exported to and imported from a CSV file. The file has one row for every possible answer: ${rows.length} rows in the template this site is built from. This page lists them all, generated from the skill's bundled template.`,
    '',
    '## Columns',
    '',
    '| Column | What it holds |',
    '|---|---|',
    '| Question ID (machine readable) | The question, e.g. `PSL_DATA_TYPES_PERSONAL`. Per-data-type questions look like `PSL_DATA_USAGE_RESPONSES:<TYPE>:<QUESTION>`. |',
    '| Response ID (machine readable) | The answer option for multiple- and single-choice questions, e.g. `PSL_NAME`. Blank for yes/no and text questions. |',
    '| Response value | `true`, `false`, blank, or text (a URL or description). Play Console exports lowercase `true`/`false`. Unchecked choices are left blank. |',
    '| Answer requirement | `REQUIRED`, `OPTIONAL`, `MULTIPLE_CHOICE`, `SINGLE_CHOICE` or `MAYBE_REQUIRED` (required only when an earlier answer makes it apply). |',
    '| Human-friendly question label | The question as shown in Play Console. |',
    '',
    'Answer requirements in this template: ' + Object.entries(counts).map(([k, v]) => `${v} \`${k}\``).join(', ') + '.',
    '',
    '<p>Import rules: keep every row, in order, and change only the <em>Response value</em> column. Importing replaces the whole form, so <a href="/guides/export-data-safety-csv/">export a backup</a> first.</p>',
    '',
    '## Top-level questions',
    '',
    '| Question ID | Response ID | Requirement | Label |',
    '|---|---|---|---|',
    ...top.map((r) => `| \`${r.qid}\` | ${r.rid ? `\`${r.rid}\`` : ''} | ${r.req} | ${esc(r.label.length > 140 ? r.label.slice(0, 137) + '…' : r.label)} |`),
    '',
    '## Data types',
    '',
    `Selecting a type sets its row in a \`PSL_DATA_TYPES_*\` question to \`true\`. There are ${typeRows.length}.`,
    '',
    '| Category question | Data type (Response ID) | Label |',
    '|---|---|---|',
    ...typeRows.map((r) => `| \`${r.qid}\` | \`${r.rid}\` | ${esc(r.label)} |`),
    '',
    '## Usage questions for each data type',
    '',
    `Every data type has the same ${usage.length} rows. Shown here for \`PSL_NAME\`; replace it with any type ID above.`,
    '',
    '| Question ID | Response ID | Requirement | Meaning |',
    '|---|---|---|---|',
    ...usage.map((r) => `| \`${r.qid}\` | ${r.rid ? `\`${r.rid}\`` : ''} | ${r.req} | ${esc(r.label.split(' / ').slice(1).join(' / ') || r.label)} |`),
    '',
    'Collected *and* shared means both `PSL_DATA_USAGE_ONLY_COLLECTED` and `PSL_DATA_USAGE_ONLY_SHARED` are `true`. The ephemeral, user-control and collection-purpose questions apply when the data is collected; sharing purposes apply when it is shared.',
    '',
    '## Purposes',
    '',
    '| Response ID | Purpose |',
    '|---|---|',
    ...purposeRows.map((r) => `| \`${r.rid}\` | ${esc(PURPOSES[r.rid])} |`),
    '',
    'Google adds questions from time to time. The latest template is always the one you export from your own Play Console; the skill prefers it to its bundled copy.',
    '',
  ];
  writeFileSync(`${docs}/reference/csv-format.mdx`, b.join('\n'));
}

// ---------------------------------------------------------------- reference: definitions

{
  const md = readFileSync(`${skill}/knowledge/definitions.md`, 'utf8').replace(/^# .*\n+/, '');
  const b = [
    '---',
    'title: "Data safety definitions: collected, shared, ephemeral"',
    `description: ${yaml("Google Play's Data safety definitions in plain words: collected, shared, ephemeral, optional, service providers, IP as location and Play Billing.")}`,
    'keywords:',
    '  - "data safety collected definition"',
    '  - "data safety shared definition"',
    '  - "data safety ephemeral meaning"',
    '---',
    '',
    `{/* Generated from skills/data-safety-from-code/knowledge/definitions.md by scripts/gen-pages.mjs. Edit that file. */}`,
    '',
    'These are the rules the skill follows when it turns code into answers. They are the same file the agent reads.',
    '',
    md.replace(/[{}]/g, (c) => (c === '{' ? '&#123;' : '&#125;')),
  ];
  writeFileSync(`${docs}/reference/definitions.mdx`, b.join('\n'));
}

console.log(`generated ${sdks.length} SDK pages, the SDK index, reference/csv-format and reference/definitions`);
