import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import theme from "./theme";

// Update theme color meta tag
const updateThemeColor = (color: string) => {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", color);
  } else {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  }
};

// Initialize theme color
updateThemeColor(theme.palette.primary.main);

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const isDevelopment =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";
    // Use '/Quizzard/service-worker.js' for GitHub Pages; change to '/service-worker.js' for custom domains
    const swPath = isDevelopment
      ? "/service-worker.js"
      : "/Quizzard/service-worker.js";

    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      })
      .catch((error) => {
        console.log("ServiceWorker registration failed: ", error);
      });
  });
}

// Get the base URL from the current location
const getBaseUrl = () => {
  const isDevelopment =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";
  // Use '/Quizzard' for GitHub Pages; change to '/' for custom domains
  return isDevelopment ? "" : "/Quizzard";
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={getBaseUrl()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
