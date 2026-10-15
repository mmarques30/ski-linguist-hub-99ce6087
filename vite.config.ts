import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Permet de vérifier en local la redirection plateforme.fli.fr/register.
    allowedHosts: ["plateforme.fli.fr"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "https://esm.sh/pdf-lib@1.17.1": "pdf-lib",
    },
  },
}));
