import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        cookieDomainRewrite: {
          '*': 'localhost',
        },
      },
      '/sanctum': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        cookieDomainRewrite: {
          '*': 'localhost',
        },
      },
      '/login': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        cookieDomainRewrite: {
          '*': 'localhost',
        },
      },
      '/logout': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        cookieDomainRewrite: {
          '*': 'localhost',
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
