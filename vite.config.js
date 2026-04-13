import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);
const gameData = require("./data/game.json");

export default defineConfig({
  base: `/staticGames/${gameData["game-id"]}/`,
  server: {
    // Cloudflare quick tunnels (and similar) use random subdomains; allow the suffix.
    allowedHosts: [".trycloudflare.com", ".loca.lt", ".ngrok-free.app", ".ngrok.io"],
  },
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
        levels: resolve(__dirname, "levels.html"),
        levelDirection: resolve(__dirname, "level-direction.html"),
        train: resolve(__dirname, "train.html"),
        controller: resolve(__dirname, "controller.html"),
        sandbox: resolve(__dirname, "sandbox.html"),
      },
    },
  },
});
