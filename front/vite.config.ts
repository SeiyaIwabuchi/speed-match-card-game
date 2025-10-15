import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // S3静的ウェブサイトホスティング用の最適化
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 本番環境ではソースマップを無効化
    rollupOptions: {
      output: {
        // チャンクファイル名の設定
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  },
  base: './', // 相対パスを使用してS3でのサブディレクトリでも動作するように
})
