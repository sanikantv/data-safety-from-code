// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://datasafety.sanikant.dev',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Data safety from code',
      description:
        'An agent skill that scans your Android code and generates the Google Play Data safety CSV, with file:line evidence for every answer.',
      logo: { src: './src/assets/logo.svg', alt: 'data-safety-from-code' },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/sanikantv/data-safety-from-code' }],
      editLink: { baseUrl: 'https://github.com/sanikantv/data-safety-from-code/edit/main/site/' },
      lastUpdated: true,
      disable404Route: true,
      customCss: ['./src/styles/tokens.css', './src/styles/springs.css', './src/styles/custom.css', './src/styles/site.css'],
      routeMiddleware: './src/route-data.ts',
      components: {
        Footer: './src/components/Footer.astro',
        PageTitle: './src/components/PageTitle.astro',
      },
      head: [
        // Self-hosted Google Sans Flex (wdth, wght, ROND axes) and Material Symbols Rounded.
        {
          tag: 'link',
          attrs: { rel: 'preload', href: '/fonts/google-sans-flex-latin.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preload', href: '/fonts/material-symbols-rounded.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        },
        // Google Search Console ownership check. Keep it, or the property loses verification.
        { tag: 'meta', attrs: { name: 'google-site-verification', content: 'umeNRLlQKuAWDZaTioJXcfOPPrNz9d72Y4BkCPLYxlc' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#F5FBF5', media: '(prefers-color-scheme: light)' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0F1511', media: '(prefers-color-scheme: dark)' } },
        // Copy buttons on install commands.
        {
          tag: 'script',
          content: `document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(!b)return;navigator.clipboard?.writeText(b.dataset.copy).then(()=>{b.dataset.copied='';setTimeout(()=>delete b.dataset.copied,1600)})})`,
        },
      ],
      expressiveCode: {
        themes: ['github-dark-default', 'github-light-default'],
        styleOverrides: {
          borderRadius: '1rem',
          codeFontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        },
      },
      sidebar: [
        { label: 'Start here', items: ['getting-started', 'how-it-works', 'comparison', 'faq', 'changelog'] },
        { label: 'Guides', items: [{ autogenerate: { directory: 'guides' } }] },
        { label: 'SDKs', collapsed: true, items: ['sdk', { autogenerate: { directory: 'sdk' } }] },
        { label: 'Reference', items: ['reference/csv-format', 'reference/definitions'] },
      ],
    }),
  ],
});
