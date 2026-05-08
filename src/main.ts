import "./styles.css";
import { mountApp } from "./app";
import { logger } from "./lib/logger";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root.");
}

mountApp(root);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((error: unknown) => logger.warn("Service worker registration failed", error));
  });
}
