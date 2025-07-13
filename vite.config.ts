import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "SValidator",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      output: {
        dir: "dist",
      },
    },
  },
  plugins: [dts()],
});
