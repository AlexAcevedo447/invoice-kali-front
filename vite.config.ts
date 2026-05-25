import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const authProxyTarget =
    env.API_BASE_URL ||
    process.env.API_BASE_URL ||
    env.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    "http://host.docker.internal:18080";
  const invoicingProxyTarget =
    env.INVOICING_API_BASE_URL ||
    process.env.INVOICING_API_BASE_URL ||
    "http://host.docker.internal:8080";

  console.log("Auth API Proxy Target:", authProxyTarget);
  console.log("Invoicing API Proxy Target:", invoicingProxyTarget);

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
      host: env.VITE_HOST || "0.0.0.0",
      port: Number(env.VITE_PORT || 5173),
      strictPort: true,
      allowedHosts: [
        env.VITE_ALLOWED_HOST || "localhost",
        ".invoicekali",
        "host.docker.internal",
      ],
      hmr: {
        overlay: false,
        host: env.VITE_HMR_HOST || undefined, // Puedes poner aquí tu dominio si lo necesitas
      },
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
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("primereact") || id.includes("primeicons")) {
              return "prime-vendor";
            }

            if (id.includes("react") || id.includes("scheduler")) {
              return "react-vendor";
            }

            if (id.includes("axios")) {
              return "network-vendor";
            }

            return "vendor";
          },
        },
      },
    },
  };
});
