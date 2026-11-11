import { RegistryProvider } from "@effect/atom-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { ToastProvider, TooltipProvider } from "./design/index.ts";
import "./index.css";

const root = document.getElementById("root");
if (root === null) throw new Error("#root element not found");

createRoot(root).render(
  <StrictMode>
    <RegistryProvider>
      <TooltipProvider delay={400}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </TooltipProvider>
    </RegistryProvider>
  </StrictMode>,
);
