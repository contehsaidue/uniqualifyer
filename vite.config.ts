import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import path from 'path';

export default defineConfig({
  optimizeDeps: {
    include: ['jsonwebtoken'],
    exclude: ['@prisma/client','.prisma/client'] // Add this
  },
  plugins: [remix()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
      '@': path.resolve(__dirname, './app')
    },
  },
  css: {
    postcss: './postcss.config.mjs'
  },
  build: {
    rollupOptions: {
     external: ['@prisma/client', '.prisma/client'], // Externalize Prisma
    }
  }, ssr: {
    noExternal: ['@prisma/client'] // Ensure Prisma is not bundled for SSR
  }
});