// Generates one MP3 per scene with ElevenLabs text-to-speech, then measures each file with
// ffprobe and writes src/timings.json, which sets each scene's length in the video.
//   ELEVENLABS_API_KEY in video/.env (gitignored). Run: npm run voiceover
// Only scenes whose text changed are regenerated (see public/voiceover/manifest.json).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const config = JSON.parse(readFileSync(`${root}/voiceover/script.json`, 'utf8'));
const manifestPath = `${root}/public/voiceover/manifest.json`;
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

if (existsSync(`${root}/.env`)) {
  for (const line of readFileSync(`${root}/.env`, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const key = process.env.ELEVENLABS_API_KEY;

for (const scene of config.scenes) {
  const file = `${root}/public/voiceover/${scene.id}.mp3`;
  const hash = createHash('sha256')
    .update(JSON.stringify([scene.text, config.voiceId, config.model, config.voiceSettings]))
    .digest('hex');
  if (manifest[scene.id] === hash && existsSync(file)) {
    console.log(`unchanged ${scene.id}`);
    continue;
  }
  if (!key) throw new Error('Set ELEVENLABS_API_KEY in video/.env');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: scene.text, model_id: config.model, voice_settings: config.voiceSettings }),
  });
  if (!res.ok) throw new Error(`${scene.id}: ElevenLabs ${res.status} ${await res.text()}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  manifest[scene.id] = hash;
  console.log(`generated ${scene.id}`);
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const timings = config.scenes.map((s) => {
  const seconds = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${root}/public/voiceover/${s.id}.mp3`])
      .toString()
      .trim(),
  );
  return { id: s.id, seconds: Math.round(seconds * 1000) / 1000, text: s.text };
});
writeFileSync(`${root}/src/timings.json`, JSON.stringify(timings, null, 2) + '\n');
console.log(timings.map((t) => `${t.id} ${t.seconds}s`).join('\n'));
console.log(`total ${timings.reduce((a, t) => a + t.seconds, 0).toFixed(1)}s of speech`);
