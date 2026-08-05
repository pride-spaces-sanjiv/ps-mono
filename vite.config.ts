import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import removeConsole from "vite-plugin-remove-console";

export default defineConfig((conf) => {
  console.log("VITE :", conf);
  const env = loadEnv(conf.mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      svgr(),
      conf.mode === "prod" ? removeConsole() : null,
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    define: {
      process: {
        env: {
          ...env,
          SECURE_STORAGE_SECRET: "HI-AulqM2w8yPcdpKF7KVg",
          SECURE_STORAGE_PREFIX: "pnl-itv",
          VITE_BASE_API: env.VITE_BASE_API || "https://panel-api.tg-iptv.site",
        },
      },
    },
  };
});
