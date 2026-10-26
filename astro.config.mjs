import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hasso5703.github.io',
  trailingSlash: 'always',
  // the code blocks are shell commands: the site's own style, readable in both themes, instead of a highlighter
  markdown: { syntaxHighlight: false, smartypants: false },
  integrations: [sitemap({ filter: (page) => !page.includes('/og/') && !page.includes('/404') })],
});
