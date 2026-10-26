# Media: intro video, voiceover, icon and images

How every image and the intro video in this repo were made, so anyone can regenerate or change them.

## Intro video

| | |
|---|---|
| File | `video/out/intro.mp4` (copied to `site/public/media/intro.mp4`) |
| Format | 1920×1080, 30 fps, H.264 + AAC, 46 s |
| Made with | [Remotion](https://www.remotion.dev/) 4.0.538 (React), source in `video/src/` |
| Fonts | Google Sans Flex (UI text) and Google Sans Code (code), via `@remotion/google-fonts`; Material Symbols Rounded icons |
| Colors | `art/palette.json`: Material 3 tonal palette from the seed `#01875F` |

Scenes, one per voiceover clip (`video/src/scenes/`):

1. **Problem**: 782 possible answers; most are about SDKs you didn't write
2. **Intro**: icon, name, tagline
3. **Scan**: project files light up and findings appear with file:line
4. **SDKs**: `play-services-ads` matched to AdMob's disclosure (rows match `knowledge/sdks.yaml`)
5. **Questions**: only what code can't show
6. **CSV**: real rows of Google's template fill in; the validator passes
7. **Import**: evidence report, then *Import to CSV*
8. **Call to action**: datasafety.sanikant.dev and the install command

Scene lengths aren't hard-coded. `video/scripts/voiceover.mjs` measures each audio clip with ffprobe and writes `video/src/timings.json`; each scene lasts as long as its clip plus a short pause, with 10-frame crossfades.

## Voiceover

| | |
|---|---|
| Provider | [ElevenLabs](https://elevenlabs.io/) text-to-speech |
| Voice | **Liam** (premade voice, ID `TX3LPaxmHKxFdv7VOQHJ`) |
| Model | `eleven_multilingual_v2` |
| Settings | stability 0.5, similarity boost 0.75, style 0.25, speaker boost on |
| Output | `video/public/voiceover/<scene>.mp3`, MP3 44.1 kHz 128 kbps |

Narration (`video/voiceover/script.json`):

> 1. Every app on Google Play needs a Data safety form. And most of the answers are about SDKs you didn't write.
> 2. Meet data safety from code: an agent skill that fills it in from your code.
> 3. It reads your manifest, Gradle files and source, and finds every place where data leaves the device.
> 4. Each SDK is matched to its vendor's own disclosure. AdMob? Device IDs, shared for advertising.
> 5. It only asks what the code can't show. Like your deletion policy.
> 6. Then it fills Google's exact CSV template, and checks every answer.
> 7. Review the report, with a file and line for each answer, then import it in Play Console.
> 8. Free and open source, at data safety dot sanikant dot dev.

The name is written "data safety from code" in the script so the voice doesn't read the hyphens.

The generated MP3s are committed, so rendering the video doesn't need an API key. Use of the audio follows the ElevenLabs terms for the account that generated it.

## Regenerate

```bash
cd video
npm ci
cp .env.example .env          # then put your key in .env as ELEVENLABS_API_KEY=...
npm run voiceover             # only scenes whose text changed are regenerated
npx remotion studio           # preview
npm run render                # writes out/intro.mp4
npm run poster                # writes out/intro-poster.png
cp out/intro.mp4 ../site/public/media/intro.mp4
```

`.env` is gitignored. Never commit an API key. If one is ever pasted anywhere public, revoke it in the ElevenLabs dashboard and create a new one.

## Icon and images

All set in Google Sans Flex, rendered from HTML with headless Chrome (`site/scripts/render-og.mjs`, `site/scripts/gen-logo.mjs`):

| File | Size | Use |
|---|---|---|
| `art/icon.svg`, `site/public/favicon.svg`, `site/src/assets/logo.svg` | vector | Logo, favicon |
| `art/icon-512.png` | 512×512 | GitHub / org avatar |
| `art/social-preview.png` | 1280×640 | GitHub repo social preview (Settings → Social preview) |
| `art/readme-banner.png` | 1280×400 | Top of the README |
| `art/how-it-works.png` | 1800×664 | README and site diagram |
| `art/intro-poster.png` | 1920×1080 | Video poster |
| `site/public/og/*.png` | 1200×630 | Open Graph images for each site section |

```bash
cd site
npm ci
npm run logo   # icon and favicon
npm run og     # Open Graph cards, social preview, banner, diagram
```

The icon is a shield holding three CSV rows, the last one a checkmark: a flat two-tone design on a rounded square, readable down to 16 px.

## Licenses

- Google Sans Flex and Google Sans Code: SIL Open Font License 1.1 (`site/public/fonts/OFL.txt`).
- Material Symbols: Apache License 2.0.
- Everything else in this repo, including the video source and images: MIT.
