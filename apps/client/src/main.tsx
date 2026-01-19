import App from "./app";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { loader } from "@monaco-editor/react";

loader.init();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
