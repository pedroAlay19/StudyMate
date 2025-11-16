import "./index.css";  // Tailwind SIEMPRE primero

import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(<App />);
