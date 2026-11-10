import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://alzeo.ai',
  trailingSlash: 'always',
  // the code blocks are shell commands: the site's own style, readable in both themes, instead of a highlighter
  markdown: { syntaxHighlight: false, smartypants: false },
  // Each URL of the sitemap names its page in the other language (English at the root, French under /fr/).
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/og/') && !page.includes('/404'),
      i18n: { defaultLocale: 'en', locales: { en: 'en', fr: 'fr' } },
    }),
  ],
});
