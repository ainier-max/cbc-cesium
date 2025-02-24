import { defineConfig } from "vite";
import pluginVue from "@vitejs/plugin-vue";
import { resolve } from "path";
import vitePluginCesium from "vite-plugin-cesium";

export default defineConfig({
  base: "./",
  // define: {
  //   __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "true",
  // },
  plugins: [pluginVue(), vitePluginCesium()],
  server: {
    host: "192.168.25.43",
    port: "4000"
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  }
});
