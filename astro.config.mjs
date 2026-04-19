import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'http://www.wzhecnu.cn',
  output: 'static',
  outDir: './public',
  publicDir: './static',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  }
});
