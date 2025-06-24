import { useState, useCallback, useEffect } from "react";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";

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
const isTokenExpired = (token: TokenResponse): boolean => {
  if (!token.expires_in) return true;

  // Get stored timestamp or default to token creation time
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  const tokenTimestamp = stored ? JSON.parse(stored).timestamp : Date.now();

  // Check if current time exceeds token expiration
  const expirationTime = tokenTimestamp + token.expires_in * 1000;
  return Date.now() >= expirationTime;
};

/**
 * useGoogleAuth - React hook for Google OAuth authentication with persistent login.
 * Persists token and user info in localStorage, restores on app load, and clears on logout.
 *
 * Features:
 * - Persistent authentication across browser sessions
 * - Graceful handling when Google OAuth provider is not available
 * - Error handling for authentication failures
 * - Automatic token restoration on app startup
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

export function useGoogleAuth() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  // Check if Google OAuth is available (provider is configured)
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    setIsAvailable(!!clientId);
  }, []);

  // Restore token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const storedToken = parsed.token;

        // Check if token is expired
        if (storedToken && !isTokenExpired(storedToken)) {
          setToken(storedToken);
          setUser(parsed.user || null);
        } else {
          // Token expired, clean up
          console.log("Stored token expired, cleaning up");
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        console.warn("Failed to restore Google auth from localStorage:", e);
        setToken(null);
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  // Save token and user to localStorage when they change
  useEffect(() => {
    if (token) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          token,
          user,
          timestamp: Date.now(), // Add timestamp for expiration checking
        })
      );
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [token, user]);

  // Google login handler - only if OAuth is available
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setToken(tokenResponse as TokenResponse);
      setError(null);

      try {
        // Fetch user profile data
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
      console.error("Google login failed:", err);
      setError("Google login failed. Please try again.");
      setUser(null);
      setToken(null);
    },
    flow: "implicit", // Use implicit flow for frontend-only apps
    scope: "email profile", // Request email and profile info access
  });

  // Safe login wrapper that checks availability
  const safeLogin = useCallback(() => {
    if (!isAvailable) {
      setError("Google OAuth is not configured. Please contact support.");
      return;
    }
    try {
      login();
    } catch (err) {
      console.error("Login attempt failed:", err);
      setError("Google OAuth is not available. Please try again later.");
    }
  }, [login, isAvailable]);

  // Logout handler
  const logout = useCallback(() => {
    try {
      if (isAvailable) {
        googleLogout();
      }
    } catch (err) {
      console.warn("Google logout failed, continuing with local cleanup:", err);
    }

    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log("User logged out");
  }, [isAvailable]);

  return {
    login: safeLogin,
    logout,
    user,
    isAuthenticated: !!token,
    error,
    token,
    isAvailable,
  };
}
