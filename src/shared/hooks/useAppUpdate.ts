/**
 * App Update Hook
 *
 * Provides functionality to check for and apply app updates.
 * Works with the service worker to handle PWA updates.
 *
 * @fileoverview App update management hook
 * @version 1.0.0
 * @since December 2025
 */

import { useState, useCallback } from "react";

interface UpdateState {
  checking: boolean;
  updateAvailable: boolean;
  error: string | null;
}

export const useAppUpdate = () => {
  const [state, setState] = useState<UpdateState>({
    checking: false,
    updateAvailable: false,
    error: null,
  });

  const checkForUpdate = useCallback(async () => {
    setState((prev) => ({ ...prev, checking: true, error: null }));

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;

        // Force a check for new service worker
        await registration.update();

        // Check if there's a new service worker waiting
        const updateAvailable = !!registration.waiting;

        setState((prev) => ({
          ...prev,
          checking: false,
          updateAvailable,
        }));

        return updateAvailable;
      } else {
        throw new Error("Service Worker not supported");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        checking: false,
        error: "Failed to check for updates",
      }));
      return false;
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;

        if (registration.waiting) {
          // Send message to service worker to skip waiting
          registration.waiting.postMessage({ type: "SKIP_WAITING" });

          // Reload the page to activate the new service worker
          window.location.reload();
        }
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to apply update",
      }));
    }
  }, []);

  return {
    ...state,
    checkForUpdate,
    applyUpdate,
  };
};
