import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);
const gameData = require("./data/game.json");

export default defineConfig({
  // Read .env values from the parent portal repository.
  envDir: resolve(__dirname, "../.."),
  base: `/staticGames/${gameData["game-id"]}/`,
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
        train: resolve(__dirname, "train.html"),
        controller: resolve(__dirname, "controller.html"),
        sandbox: resolve(__dirname, "sandbox.html"),
      },
    },
  },
});
