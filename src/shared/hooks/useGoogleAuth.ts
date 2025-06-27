import { useState, useCallback, useEffect, useRef } from "react";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import { authStorage, type AuthData } from "../services/authStorage";
import { tokenRefresh } from "../services/tokenRefresh";
import { useNetworkStatus } from "./useNetworkStatus";

/**
 * TokenResponse interface - matches the expected structure from Google OAuth
 * Defined locally since the package doesn't export this type properly
 */
interface TokenResponse {
  /** The access token of a successful token response */
  access_token: string;
  /** The lifetime in seconds of the access token */
  expires_in?: number;
  /** The type of the token issued */
  token_type?: string;
  /** The scopes of the access token */
  scope?: string;
  /** Error information if authentication fails */
  error?: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * GoogleUserProfile - Interface for Google user profile data
 */
interface GoogleUserProfile {
  /** User's email address */
  email: string;
  /** User's full name */
  name: string;
  /** URL to user's profile picture */
  picture: string;
  /** Whether the email is verified */
  email_verified: boolean;
  /** User's locale */
  locale: string;
}

/**
 * Fetches the user's Google profile using the access token
 */
const fetchUserProfile = async (
  accessToken: string
): Promise<GoogleUserProfile> => {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
};

/**
 * Checks if a token is expired based on its expiration time
 */
const isTokenExpired = (token: TokenResponse, timestamp?: number): boolean => {
  if (!token.expires_in) return true;

  // Use provided timestamp or default to current time
  const tokenTimestamp = timestamp || Date.now();

  // Check if current time exceeds token expiration
  const expirationTime = tokenTimestamp + token.expires_in * 1000;
  return Date.now() >= expirationTime;
};

/**
 * useGoogleAuth - React hook for Google OAuth authentication with persistent login.
 * Now uses IndexedDB with localStorage fallback for better token persistence.
 *
 * Features:
 * - Persistent authentication across browser sessions
 * - IndexedDB primary storage with localStorage fallback
 * - Graceful handling when Google OAuth provider is not available
 * - Error handling for authentication failures
 * - Automatic token restoration on app startup
 * - Migration support from localStorage to IndexedDB
 *
 * Usage:
 *   const { login, logout, user, isAuthenticated, error, isAvailable } = useGoogleAuth();
 *
 * Returns:
 * - login: function to trigger Google login popup
 * - logout: function to sign out the user
 * - user: user profile info (null if not logged in)
 * - isAuthenticated: boolean, true if user is logged in
 * - error: error message if authentication fails
 * - isAvailable: boolean, true if Google OAuth is properly configured
 */
const LOCAL_STORAGE_KEY = "quizzard-google-auth-token";

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Environment variable handling that works in both Vite and Jest
const getGoogleClientId = (): string => {
  // In Vite environment
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  }
  // In Jest environment or fallback
  return process.env.VITE_GOOGLE_CLIENT_ID || "";
};

export function useGoogleAuth() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [refreshStatus, setRefreshStatus] = useState<
    "idle" | "refreshing" | "error"
  >("idle");
  const [loggingOut, setLoggingOut] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const networkStatus = useNetworkStatus();

  // Check if Google OAuth is available (provider is configured)
  useEffect(() => {
    const clientId = getGoogleClientId();
    setIsAvailable(!!clientId);
  }, []);

  // Restore token from storage on mount
  useEffect(() => {
    if (loggingOut) return;
    const restoreAuth = async () => {
      try {
        const stored = await authStorage.loadAuthData();
        if (stored) {
          const storedToken = stored.token;

          // Check if token is expired
          if (storedToken && !isTokenExpired(storedToken, stored.timestamp)) {
            setToken(storedToken);
            setUser(stored.user || null);
          } else {
            // Token expired, clean up
            console.log("Stored token expired, cleaning up");
            await authStorage.deleteAuthData();
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.warn("Failed to restore Google auth from storage:", e);
        setToken(null);
        setUser(null);
        try {
          await authStorage.deleteAuthData();
        } catch (cleanupError) {
          console.warn("Failed to cleanup auth storage:", cleanupError);
        }
      }
    };

    restoreAuth();
  }, [loggingOut]);

  // Save token and user to storage when they change
  useEffect(() => {
    if (loggingOut) return;
    const saveAuth = async () => {
      try {
        if (token) {
          const authData: AuthData = {
            token,
            user,
            timestamp: Date.now(), // Add timestamp for expiration checking
          };
          await authStorage.saveAuthData(authData);
        } else {
          await authStorage.deleteAuthData();
        }
      } catch (error) {
        console.warn("Failed to save auth data to storage:", error);
      }
    };

    saveAuth();
  }, [token, user, loggingOut]);

  // Setup automatic token refresh when token is available
  useEffect(() => {
    const setupTokenRefresh = () => {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      if (!token || !token.expires_in) {
        return;
      }

      // Calculate when to refresh (5 minutes before expiration)
      const refreshTime = (token.expires_in - 5 * 60) * 1000; // Convert to milliseconds

      if (refreshTime > 0) {
        refreshTimeoutRef.current = setTimeout(async () => {
          setRefreshStatus("refreshing");

          try {
            const result = await tokenRefresh.refreshToken();

            if (result.success && result.token) {
              setToken(result.token);
              setRefreshStatus("idle");
              console.log("Token refreshed successfully");
            } else {
              setRefreshStatus("error");
              console.warn("Token refresh failed:", result.error);
              setError("Session will expire soon. Please login again.");
            }
          } catch (err) {
            setRefreshStatus("error");
            console.error("Token refresh error:", err);
            setError("Session maintenance failed. Please login again.");
          }
        }, refreshTime);
      }
    };

    setupTokenRefresh();

    // Cleanup timeout on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [token]);

  // Google login handler - only if OAuth is available
  const loginRef = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("[DEBUG] Google login onSuccess triggered", tokenResponse);
      setToken(tokenResponse as TokenResponse);
      setError(null);
      try {
        const userProfile = await fetchUserProfile(tokenResponse.access_token);
        setUser(userProfile);
        console.log("Google login successful with user profile");
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError(
          "Login successful but failed to fetch profile. Please try again."
        );
        setUser(null);
        setToken(null);
      }
    },
    onError: (err) => {
      console.error("[DEBUG] Google login onError triggered", err);
      setError("Google login failed. Please try again.");
      setUser(null);
      setToken(null);
    },
    flow: "implicit", // Use implicit flow for frontend-only apps to get access_token directly
    scope:
      "email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/presentations",
  });

  // Safe login wrapper that checks availability and network status
  const safeLogin = useCallback(() => {
    if (!isAvailable) {
      setError("Google OAuth is not configured. Please contact support.");
      return;
    }
    if (!networkStatus.isOnline) {
      setError("You're offline. Please check your internet connection.");
      return;
    }
    try {
      loginRef();
    } catch (err) {
      console.error("Login attempt failed:", err);
      setError("Google OAuth is not available. Please try again later.");
    }
  }, [isAvailable, networkStatus]);

  // Logout handler
  const logout = useCallback(async () => {
    setLoggingOut(true);
    console.log("Starting logout process...");
    let errors: Error[] = [];

    // Step 1: Google OAuth Logout
    try {
      if (isAvailable) {
        googleLogout();
        console.log("✓ Google OAuth logout completed");
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Google logout failed");
      console.warn("✗ Google logout failed:", error);
      errors.push(error);
    }

    // Step 2: Clear Auth Storage (IndexedDB + localStorage)
    try {
      await authStorage.deleteAuthData();
      console.log("✓ Auth data deleted from all storage locations");
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Storage cleanup failed");
      console.error("✗ Failed to clear auth storage:", error);
      errors.push(error);

      // Emergency Fallback: Direct localStorage cleanup
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        console.log(
          "✓ Emergency fallback: Removed auth data from localStorage"
        );
      } catch (fallbackErr) {
        const fallbackError =
          fallbackErr instanceof Error
            ? fallbackErr
            : new Error("localStorage cleanup failed");
        console.error("✗ Even localStorage fallback failed:", fallbackError);
        errors.push(fallbackError);
      }
    }

    // Step 3: Clear Local React State
    try {
      setUser(null);
      setToken(null);
      setError(null);
      console.log("✓ Local React state cleared");
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("State cleanup failed");
      console.error("✗ Failed to clear local state:", error);
      errors.push(error);
    }

    // Step 4: Clear Profile Data and Settings
    try {
      // Clear any profile-related localStorage items
      localStorage.removeItem("quizzard-user-settings");
      localStorage.removeItem("quizzard-profile-cache");
      console.log("✓ Profile data and settings cleared");
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Profile cleanup failed");
      console.error("✗ Failed to clear profile data:", error);
      errors.push(error);
    }

    setLoggingOut(false);

    // Final Status Report
    if (errors.length > 0) {
      console.warn(`Logout completed with ${errors.length} errors:`, errors);
    } else {
      console.log("✓ Logout completed successfully");
    }
  }, [isAvailable]);

  return {
    login: safeLogin,
    logout,
    user,
    isAuthenticated: !!token,
    error,
    token,
    isAvailable,
    refreshStatus,
    networkStatus,
  };
}
