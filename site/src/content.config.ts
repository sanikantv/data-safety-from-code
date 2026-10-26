import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Questions rendered on the page and as FAQPage JSON-LD.
        faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
        // Rendered as <meta name="keywords">. Taken from the keyword map in seo-report.md.
        keywords: z.array(z.string()).optional(),
        // Optional per-page Open Graph image under /og/.
        ogImage: z.string().optional(),
      }),
    }),
  }),
};
