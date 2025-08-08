import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  base: '/coloruv/',
  define: {
    'import.meta.env.VERSION': JSON.stringify(pkg.version),
  },
})
