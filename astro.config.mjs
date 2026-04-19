import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';

export default defineConfig({
  site: 'https://rexblog.example.com', // FIXME: update with real site url
  integrations: [
    expressiveCode({
      themes: ['github-light'],
      useDarkModeMediaQuery: false,
      plugins: [pluginCollapsibleSections()],
    }),
    mdx(),
    sitemap()
  ],
});
