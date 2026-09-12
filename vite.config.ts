import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  // vite-plugin-cesium copies Cesium's static assets (Workers, Assets,
  // ThirdParty, Widgets) and sets window.CESIUM_BASE_URL automatically,
  // which a plain `cesium` import does not do under Vite.
  plugins: [react(), cesium()],
  server: {
    port: 5173,
    open: false,
  },
});
