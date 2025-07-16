import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import path from 'path'

export default defineConfig({
  optimizeDeps: {
    include: ['jsonwebtoken']
  },
  plugins: [remix()],
    resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'), 
    },
  },
  css: {
    postcss: './postcss.config.mjs'
  }
});