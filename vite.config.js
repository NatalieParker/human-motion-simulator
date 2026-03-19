import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "/human-motion-simulator/",
  plugins: [preact()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        controller: resolve(__dirname, "controller.html"),
        sandbox: resolve(__dirname, "sandbox.html"),
      },
    },
  },
});
