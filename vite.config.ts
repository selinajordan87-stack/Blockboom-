import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages project site: https://<owner>.github.io/Blockboom-/
  base: "/Blockboom-/",
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ["three"] } },
    },
  },
});
