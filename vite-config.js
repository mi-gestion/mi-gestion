import { defineConfig } from "vite";
import obfuscator from "rollup-plugin-javascript-obfuscator";

export default defineConfig({
  // Si vas a usar GitHub Pages, el base suele ser el nombre de tu repo: '/nombre-repo/'
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      plugins: [
        obfuscator({
          compact: true,
          controlFlowFlattening: true, // Hace el código casi ilegible para humanos
          deadCodeInjection: true, // Inyecta código basura para confundir
          debugProtection: true, // Dificulta el uso de DevTools (F12)
          selfDefending: true, // Hace que el código falle si se formatea (beautify)
          stringArray: true,
          stringArrayThreshold: 0.75,
        }),
      ],
    },
  },
});
