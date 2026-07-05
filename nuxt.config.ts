export default defineNuxtConfig({
  compatibilityDate: '2026-07-05',

  modules: ['@pinia/nuxt', 'nuxt-auth-utils', '@nuxt/eslint'],

  ssr: true,

  imports: {
    scan: false
  },

  components: {
    dirs: [],
  },

  css: ['@/scss/app.scss', '@fortawesome/fontawesome-svg-core/styles.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      bodyAttrs: { class: 'has-navbar-fixed-top' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
      meta: [
        { property: 'og:type', content: 'website' },
        { name: 'color-scheme', content: 'light dark' },
        { name: 'theme-color', content: '#e56a00' },
      ],
      link: [
        { rel: 'preconnect', href: 'http://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'http://fonts.googleapis.com', crossorigin: '' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      ],
    },
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        jsx: 'preserve',
        jsxImportSource: 'vue',
        noUncheckedIndexedAccess: false,
      },
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules') && id.includes('markdown-it')) {
              return 'vendor_markdown-it'
            }
            return null
          },
        },
      },
    },
  },
})
