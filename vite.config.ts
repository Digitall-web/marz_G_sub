import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Only use single-file plugin for production build to prevent dev HMR/serve issues
export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  return {
    plugins: [react(), isBuild && viteSingleFile()].filter(Boolean),
    build: {
      target: 'es2018',
      cssMinify: true,
      reportCompressedSize: false,
      assetsInlineLimit: 100000000,
    }
  };
});
