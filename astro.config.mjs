import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';

export default defineConfig({
  site: 'http://www.wzhecnu.cn',
  output: 'static',
  outDir: './public',
  publicDir: './static',
  integrations: [
    expressiveCode({
      themes: ['github-light'],
      styleOverrides: {
        borderRadius: '8px',
        borderWidth: '1px',
        borderColor: '#e5e7eb',
        frames: {
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          frameBoxShadowCssValue: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
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
