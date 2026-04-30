import { existsSync } from "fs";
import { defineConfig, loadEnv } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);
const gameData = require("./data/game.json");

function loadPortalEnv(mode) {
  if (process.env.VITE_USE_LOCAL_ENV !== "true") return {};

  const portalRepoDir = process.env.VITE_PORTAL_REPO_DIR || resolve(__dirname, "..", "game-portal");
  if (!existsSync(portalRepoDir)) return {};

  return loadEnv(mode, portalRepoDir, "VITE_");
}

export default defineConfig(({ mode }) => {
  const localEnv = loadEnv(mode, __dirname, "VITE_");
  const portalEnv = loadPortalEnv(mode);

  const openAiApiKey = localEnv.VITE_OPENAI_API_KEY || portalEnv.VITE_OPENAI_API_KEY || "";
  const openAiModel = localEnv.VITE_OPENAI_MODEL || portalEnv.VITE_OPENAI_MODEL || "";

  return {
    base: `/staticGames/${gameData["game-id"]}/`,
    server: {
      // Cloudflare quick tunnels (and similar) use random subdomains; allow the suffix.
      allowedHosts: [".trycloudflare.com", ".loca.lt", ".ngrok-free.app", ".ngrok.io"],
    },
    plugins: [preact()],
    define: {
      "import.meta.env.VITE_OPENAI_API_KEY": JSON.stringify(openAiApiKey),
      "import.meta.env.VITE_OPENAI_MODEL": JSON.stringify(openAiModel),
    },
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
          levelDirection: resolve(__dirname, "levels/level-direction.html"),
          levelAccelerationVsMotion: resolve(__dirname, "levels/level-acceleration-vs-motion.html"),
          levelSharpPeaks: resolve(__dirname, "levels/level-sharp-peaks.html"),
          levelPositiveNegative: resolve(__dirname, "levels/level-positive-negative.html"),
          levelAccelVsDecel: resolve(__dirname, "levels/level-accel-vs-decel.html"),
          levelAccelerationWithG: resolve(__dirname, "levels/level-acceleration-with-g.html"),
          levelGBaselineStillness: resolve(__dirname, "levels/level-g-baseline-stillness.html"),
          levelGAxisTransfer: resolve(__dirname, "levels/level-g-axis-transfer.html"),
          levelWithGVsWithoutG: resolve(__dirname, "levels/level-with-g-vs-without-g.html"),
          levelFastVsSlowAcceleration: resolve(__dirname, "levels/level-fast-vs-slow-acceleration.html"),
          levelComplexCircularMotion: resolve(__dirname, "levels/level-complex-circular-motion.html"),
          levelFreefall: resolve(__dirname, "levels/level-freefall.html"),
          train: resolve(__dirname, "train.html"),
          controller: resolve(__dirname, "controller.html"),
          sandbox: resolve(__dirname, "sandbox.html"),
        },
      },
    },
  };
});
