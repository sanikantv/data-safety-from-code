// Adds per-page Open Graph images and JSON-LD. Starlight already writes title, description,
// canonical, og:title/description/url/type and twitter:card from each page's frontmatter.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { AUTHOR, AUTHOR_NAME, HUB, REPO, SITE_URL, VERSION } from './lib/site';

const SECTIONS: Record<string, string> = { sdk: 'SDKs', reference: 'Reference', guides: 'Guides' };
const DEFAULT_KEYWORDS = ['google play data safety form', 'data safety csv', 'data safety form generator'];

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const { entry, head, id } = route;
  const data = entry.data as typeof entry.data & {
    faq?: { q: string; a: string }[];
    keywords?: string[];
    ogImage?: string;
  };
  const url = new URL(context.url.pathname, SITE_URL).href;
  const section = id.split('/')[0];

  const ogImage = new URL(
    data.ogImage ?? (id === '' || id === 'index' ? '/og/home.png' : SECTIONS[section] ? `/og/${section}.png` : '/og/docs.png'),
    SITE_URL,
  ).href;
  head.push(
    { tag: 'meta', attrs: { name: 'author', content: AUTHOR_NAME }, content: '' },
    { tag: 'link', attrs: { rel: 'author', href: HUB }, content: '' },
    { tag: 'meta', attrs: { name: 'keywords', content: (data.keywords ?? DEFAULT_KEYWORDS).join(', ') }, content: '' },
    { tag: 'meta', attrs: { property: 'og:image', content: ogImage }, content: '' },
    { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, content: '' },
    { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, content: '' },
    { tag: 'meta', attrs: { name: 'twitter:image', content: ogImage }, content: '' },
  );

  const graph: object[] = [];
  if (id === '' || id === 'index') {
    graph.push({
      '@type': 'SoftwareSourceCode',
      name: 'data-safety-from-code',
      description: data.description,
      url: SITE_URL,
      codeRepository: REPO,
      programmingLanguage: 'Python',
      runtimePlatform: 'Python 3.9+',
      version: VERSION,
      license: 'https://opensource.org/licenses/MIT',
      keywords: ['Google Play', 'Data safety', 'Play Console', 'Android', 'agent skill', 'Claude Code'],
      author: AUTHOR,
    });
    graph.push({
      '@type': 'VideoObject',
      name: 'data-safety-from-code in 46 seconds',
      description: 'How the data-safety-from-code agent skill turns Android code into a Google Play Data safety CSV with evidence for every answer.',
      thumbnailUrl: `${SITE_URL}/media/intro-poster.jpg`,
      contentUrl: `${SITE_URL}/media/intro.mp4`,
      uploadDate: '2026-10-26',
      duration: 'PT46S',
    });
  } else {
    const crumbs = [{ name: 'Home', url: `${SITE_URL}/` }];
    if (SECTIONS[section]) crumbs.push({ name: SECTIONS[section], url: `${SITE_URL}/${section}/` });
    crumbs.push({ name: data.title, url });
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
    });
  }
  if (section === 'guides') {
    head.push({ tag: 'meta', attrs: { property: 'article:author', content: HUB }, content: '' });
    graph.push({
      '@type': 'TechArticle',
      headline: data.title,
      description: data.description,
      url,
      author: AUTHOR,
      proficiencyLevel: 'Beginner',
      keywords: data.keywords,
    });
  }
  if (data.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: data.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    });
  }
  head.push({
    tag: 'script',
    attrs: { type: 'application/ld+json' },
    content: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
  });
});
