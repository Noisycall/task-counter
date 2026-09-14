import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  dev: {
    sourcemap: true,
  },
  server: {
    hmr: true,
  },
  plugins: [
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
