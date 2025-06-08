import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// @ts-expect-error
import vitePluginFaviconsInject from 'vite-plugin-favicons-inject'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vueJsx({}),
    vue(),
    vitePluginFaviconsInject('./src/favicon_upscaled.png', {
      appName: 'Yukkuricraft forums archive',
      appDescription: 'Yukkuricraft forums archive',
      developerName: 'Katrix',
      developerURL: null,
      background: '#fff',
      theme_color: '#e56a00',
      icons: {
        coast: false,
        firefox: false,
        yandex: false,
      },
    }),
    visualizer({ template: 'treemap', open: true, gzipSize: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: './dist',
    target: 'es2022',
    assetsInlineLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }

          return null
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
      '/core': {
        target: 'http://localhost:3000',
      },
      '/showthread.php': {
        target: 'http://localhost:3000',
      },
    },
  },
})
