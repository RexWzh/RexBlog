import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';

export default defineConfig({
  site: 'http://www.wzhecnu.cn',
  output: 'static',
  outDir: './public',
  publicDir: './static',
  integrations: [
    expressiveCode({
      themes: ['github-dark'],
      styleOverrides: {
        borderRadius: '0px',
        borderWidth: '2px',
        borderColor: 'var(--text)',
        frames: {
          shadowColor: 'transparent',
          frameBoxShadowCssValue: '4px 4px 0 var(--text)',
        },
        codePaddingInline: '1.5rem',
        codePaddingBlock: '1.5rem',
      }
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  }
});
