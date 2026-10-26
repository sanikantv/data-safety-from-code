# Deploying datasafety.sanikant.dev

The site is static (Astro + Starlight) and runs on **Cloudflare Workers static assets**. `wrangler.jsonc` maps the custom domain `datasafety.sanikant.dev`; Cloudflare creates the DNS record and certificate on the first deploy.

## Build locally

You need Node 22.23+.

```bash
cd site
npm ci
npm run build    # generates SDK and reference pages from the skill, builds, subsets the icon font
npm run check    # one H1, unique titles/descriptions, JSON-LD, sitemap, links
npm run preview  # http://localhost:4321
```

## What's generated (and committed)

| File | Made by | From |
|---|---|---|
| `src/content/docs/sdk/*.mdx`, `src/data/sdks.json` | `scripts/gen-pages.mjs` (runs in `npm run build`) | `skills/.../knowledge/sdks.json` |
| `src/content/docs/reference/csv-format.mdx` | `scripts/gen-pages.mjs` | `skills/.../template/data_safety_template.csv` |
| `src/content/docs/reference/definitions.mdx` | `scripts/gen-pages.mjs` | `skills/.../knowledge/definitions.md` |
| `public/fonts/material-symbols-rounded.woff2` | `scripts/fetch-icons.mjs` (runs in `npm run build`) | icons used in `dist/` |
| `public/og/*.png`, `../art/*.png` | `npm run og` (headless Chrome) | `scripts/render-og.mjs` |
| `src/assets/logo.svg`, `public/favicon.svg`, `../art/icon.svg` | `npm run logo` | `scripts/gen-logo.mjs` |
| `public/media/intro.mp4`, `intro-poster.jpg` | `../video` (see `../MEDIA.md`) | Remotion |

Edit the skill's knowledge files, not the generated pages. CI fails if a generated page is out of date.

## Deploy by hand

```bash
cd site
npx wrangler login     # once
npm run deploy
```

## Deploy from GitHub Actions

`.github/workflows/docs.yml` builds and checks the site on every push and pull request. It deploys on pushes to `main` once these repository secrets exist:

1. Cloudflare dashboard → **My Profile → API Tokens → Create Token** → template **Edit Cloudflare Workers**, limited to your account and the `sanikant.dev` zone.
2. GitHub → **Settings → Secrets and variables → Actions**: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## After the first deploy

- Google Search Console (the `sanikant.dev` domain property covers this subdomain): submit `https://datasafety.sanikant.dev/sitemap-index.xml`.
- GitHub repo → **About → Website**: `https://datasafety.sanikant.dev`.
- GitHub repo → **Settings → Social preview**: upload `art/social-preview.png`.
