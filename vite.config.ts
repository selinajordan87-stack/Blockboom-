import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages project site: https://<owner>.github.io/blockboom/
  base: "/blockboom/",
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ["three"] } },
    },
  },
});
