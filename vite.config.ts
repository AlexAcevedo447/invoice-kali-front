import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const authProxyTarget =
    env.API_BASE_URL ||
    env.VITE_API_BASE_URL ||
    "http://host.docker.internal:18080";
  const invoicingProxyTarget =
    env.INVOICING_API_BASE_URL || "http://host.docker.internal:8080";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@app": fileURLToPath(new URL("./src/app", import.meta.url)),
        "@core": fileURLToPath(new URL("./src/core", import.meta.url)),
        "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
        "@modules": fileURLToPath(new URL("./src/modules", import.meta.url)),
      },
    },
    server: {
      proxy: {
        "/api/v1/invoices": {
          target: invoicingProxyTarget,
          changeOrigin: true,
        },
        "/api/v1/invoice-items": {
          target: invoicingProxyTarget,
          changeOrigin: true,
        },
        "/api/v1/metrics": {
          target: invoicingProxyTarget,
          changeOrigin: true,
        },
        "/api": {
          target: authProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
