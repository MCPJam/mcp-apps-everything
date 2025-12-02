import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppComponent } from "./App";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppComponent />
  </StrictMode>
);
