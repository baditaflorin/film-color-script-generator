import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/film-color-script-generator/",
  publicDir: "public",
  build: {
    outDir: "docs",
    emptyOutDir: false,
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@ffmpeg")) {
            return "ffmpeg";
          }
          if (id.includes("comlink")) {
            return "worker-vendor";
          }
          return undefined;
        }
      }
    }
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/features/**/*.ts"],
      exclude: ["src/features/**/*.worker.ts"]
    }
  }
});
