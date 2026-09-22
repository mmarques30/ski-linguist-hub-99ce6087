import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initTheme } from "./components/layout/ThemeToggle";
import "./index.css";

// Applique le thème mémorisé avant le premier rendu (évite le flash clair).
initTheme();

createRoot(document.getElementById("root")!).render(<App />);
