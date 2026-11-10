import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the Effect server so the browser stays same-origin.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
