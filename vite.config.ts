import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];

  // Add bundle analyzer in analyze mode
  if (mode === "analyze") {
    plugins.push(
      visualizer({
        filename: "dist/bundle-analysis.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    );
  }

  return {
    plugins,
    base: "/Quizzard/",
    server: {
      port: 5173,
      strictPort: true,
      host: true,
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true,
      // Improve caching and performance
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            mui: ["@mui/material", "@mui/icons-material", "@mui/system"],
          },
        },
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ["react", "react-dom", "@mui/material", "@mui/icons-material"],
    },
  };
});
