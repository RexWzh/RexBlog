import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';

export default defineConfig({
  site: 'https://rexblog.example.com', // FIXME: update with real site url
  integrations: [
    expressiveCode({
      themes: ['github-light'],
      useDarkModeMediaQuery: false,
    }),
    mdx(),
    sitemap()
  ],
});
