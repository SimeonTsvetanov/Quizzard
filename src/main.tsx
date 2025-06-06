import { StrictMode } from "react"; // a tool for highlighting potential problems in the app during development.
import { createRoot } from "react-dom/client"; // Imports the function to create a root React rendering context for the app (the modern way in React 18+)
import "./index.css"; // Imports the global CSS styles, so they apply to your whole app.
import App from "./App.tsx"; // Imports the main React component, which contains the app UI and logic.
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter for routing

// Register service worker for PWA auto-update
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/Quizzard/sw.js")
      .then((registration) => {
        // Listen for updates from the service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "SW_UPDATED") {
            // Auto-reload the page to get the latest version
            window.location.reload();
          }
        });
      })
      .catch((registrationError) => {
        console.log("SW registration failed:", registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/Quizzard/">
      <App />
    </BrowserRouter>
  </StrictMode>
);
