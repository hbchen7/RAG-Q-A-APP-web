import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 自动导入组件ElementPlus
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/oneapi': {
        target: 'http://localhost:3000', // OneAPI 地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/oneapi/, ''),
      },
    },
  },
  plugins: [
    vue(),
    vueDevTools(),
    // 自动导入组件ElementPlus
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  // base: '/',
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '@/assets/styles/theme.scss' as *;`,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
