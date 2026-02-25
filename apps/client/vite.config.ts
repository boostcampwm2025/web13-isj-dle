import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths(), svgr()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("phaser")) return "phaser";
          if (id.includes("easystarjs")) return "easystarjs";
          if (id.includes("@livekit/krisp-noise-filter")) return "livekit-krisp";
          if (id.includes("@livekit/components-react")) return "livekit-component";
          if (id.includes("livekit-client")) return "livekit-client";
          if (id.includes("monaco-editor")) return "monaco-editor";
          if (id.includes("tldraw")) return "tldraw";
          if (id.includes("socket.io-client")) return "socket";
          if (id.includes("react")) return "react-vendor";

          return "vendor";
        },
      },
    },
  },
});
