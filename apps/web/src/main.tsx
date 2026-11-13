import { RegistryProvider } from "@effect/atom-react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "#/components/ui/toast.tsx";
import { TooltipProvider } from "#/components/ui/tooltip.tsx";
import { routeTree } from "./routeTree.gen.ts";
import "./styles/globals.css";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  // On desktop, pages scroll inside the inset <main> panel, not the window.
  scrollToTopSelectors: ["#main"],
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (root === null) throw new Error("#root element not found");

createRoot(root).render(
  <StrictMode>
    <RegistryProvider>
      <TooltipProvider delay={400}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </TooltipProvider>
    </RegistryProvider>
  </StrictMode>,
);
