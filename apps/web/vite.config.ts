import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite-plus";

export default defineConfig(({ mode }) => {
  // `alchemy dev` passes the API's address in API_URL.
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [
      // Must come before the React plugin: it generates `src/routeTree.gen.ts`
      // from `src/routes` and code-splits each route.
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
    ],
    server: {
      // Forward API calls to the Effect server so the browser stays same-origin.
      proxy: { "/api": env.API_URL ?? "http://localhost:3000" },
    },
  };
});
