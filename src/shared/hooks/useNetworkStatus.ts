/**
 * Network Status Hook - Phase 3
 * Following DEVELOPMENT-STANDARDS.md: React hooks for state, custom hooks for reusable logic
 */

import { useState, useEffect } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  // isGoogleAPIAvailable: boolean; // Removed to avoid CORS errors
  lastChecked: number;
}

/**
 * Hook for monitoring network status
 * Used for offline detection and graceful degradation
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // const [isGoogleAPIAvailable, setIsGoogleAPIAvailable] = useState(true); // Removed
  const [lastChecked, setLastChecked] = useState(Date.now());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastChecked(Date.now());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastChecked(Date.now());
    };

    // Set up event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    // isGoogleAPIAvailable, // Removed
    lastChecked,
  };
}
