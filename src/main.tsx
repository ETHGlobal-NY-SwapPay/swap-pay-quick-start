import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import App from "./App.tsx";
import RainbowKitConfig from "./config/RainbowKitProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RainbowKitConfig>
      <App />
    </RainbowKitConfig>
  </StrictMode>
);
