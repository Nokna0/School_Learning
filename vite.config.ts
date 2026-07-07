// vite.config.ts
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  // 개발 루트: client/
  root: path.resolve(import.meta.dirname, "client"),

  // 정적 자산 루트
  publicDir: path.resolve(import.meta.dirname, "client", "public"),

  // 출력 폴더 (프로젝트 루트 기준 dist/public)
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false, // 프로덕션에서 소스맵 비활성화
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 라이브러리를 별도 청크로 분리
          "react-vendor": ["react", "react-dom", "react-hook-form"],
          // UI 라이브러리를 별도 청크로 분리
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
          ],
          // PDF.js를 별도 청크로 분리
          "pdf-vendor": ["pdfjs-dist"],
        },
      },
    },
  },

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },

  envDir: path.resolve(import.meta.dirname),

  server: {
    host: true,
    fs: { strict: true, deny: ["**/.*"] },
    // 개발 시 클라이언트(5173)에서 백엔드(3000)로 API 프록시
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
