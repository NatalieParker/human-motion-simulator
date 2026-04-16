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
        main: resolve(__dirname, "pages/index.html"),
        levels: resolve(__dirname, "pages/levels/levels.html"),
        levelDirection: resolve(__dirname, "pages/levels/level-direction.html"),
        levelAccelerationVsMotion: resolve(__dirname, "pages/levels/level-acceleration-vs-motion.html"),
        levelSharpPeaks: resolve(__dirname, "pages/levels/level-sharp-peaks.html"),
        levelPositiveNegative: resolve(__dirname, "pages/levels/level-positive-negative.html"),
        levelAccelVsDecel: resolve(__dirname, "pages/levels/level-accel-vs-decel.html"),
        levelAccelerationWithG: resolve(__dirname, "pages/levels/level-acceleration-with-g.html"),
        levelGBaselineStillness: resolve(__dirname, "pages/levels/level-g-baseline-stillness.html"),
        levelGAxisTransfer: resolve(__dirname, "pages/levels/level-g-axis-transfer.html"),
        levelWithGVsWithoutG: resolve(__dirname, "pages/levels/level-with-g-vs-without-g.html"),
        levelFastVsSlowAcceleration: resolve(__dirname, "pages/levels/level-fast-vs-slow-acceleration.html"),
        levelComplexCircularMotion: resolve(__dirname, "pages/levels/level-complex-circular-motion.html"),
        levelFreefall: resolve(__dirname, "pages/levels/level-freefall.html"),
        train: resolve(__dirname, "pages/train.html"),
        controller: resolve(__dirname, "pages/controller.html"),
        sandbox: resolve(__dirname, "pages/sandbox.html"),
      },
    },
  },
});
