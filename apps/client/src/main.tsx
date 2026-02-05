import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { loader } from "@monaco-editor/react";

import App from "./app";
import { LogLevel, setLogLevel } from "livekit-client";

loader.init();

if (import.meta.env.VITE_APP_ENV === "production") {
  console.error = () => {};
  console.debug = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.log = () => {};
  setLogLevel(LogLevel.error);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
