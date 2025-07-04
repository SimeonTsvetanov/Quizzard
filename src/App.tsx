import { useEffect, useState, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Snackbar,
  Alert,
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import "./App.css";
import { useTheme } from "./shared/hooks/useTheme";
import Header from "./shared/components/Header";
import Footer from "./shared/components/Footer";
import { LoadingScreen } from "./shared/components/LoadingScreen";
import { ErrorBoundary } from "./shared/components";
import { performLegacyStorageMigration } from "./shared/utils/storageKeys";
import ProfileSelectionModal from "./shared/components/ProfileSelectionModal";
import { useGoogleAuth } from "./shared/hooks/useGoogleAuth";

// Lazy load all route components for better performance
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const RandomTeamGeneratorPage = lazy(
  () => import("./features/random-team-generator/pages/RandomTeamGeneratorPage")
);
const PointsCounter = lazy(
  () => import("./features/points-counter/pages/PointsCounter")
);
const Quizzes = lazy(() => import("./features/quizzes/pages/Quizzes"));
const FinalQuestionPage = lazy(
  () => import("./features/final-question/pages/FinalQuestionPage")
);

// Loading fallback component for lazy-loaded routes
const RouteLoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "calc(100vh - 120px)", // Account for header and footer
      flexGrow: 1,
    }}
  >
    <CircularProgress size={48} />
  </Box>
);

const PWA_INSTALL_DISMISSED_KEY = "user-settings-pwa-install-dismissed";

// PWA Install Event Interface
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function App() {
  // Use our custom theme hook
  const { mode, theme, handleThemeChange } = useTheme();

  // Loading screen state - only show on initial app startup
  const [showLoadingScreen, setShowLoadingScreen] = useState(() => {
    // Only show loading screen on initial visit or PWA launch
    return !sessionStorage.getItem("app-loaded");
  });

  // Perform legacy storage migration on app startup
  // This ensures existing user data is preserved when switching to new storage keys
  useEffect(() => {
    performLegacyStorageMigration();
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  // PWA install prompt state
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    // Only process path params when the app loads with a search parameter
    if (location.search) {
      const queryParams = new URLSearchParams(location.search);
      const redirectedPath = queryParams.get("path");
      console.log("Redirected Path:", redirectedPath);

      if (redirectedPath !== null) {
        if (redirectedPath === "" || redirectedPath === "/") {
          // Handle root path
          navigate("/", { replace: true });
        } else {
          // Handle other paths
          const sanitizedPath = redirectedPath.replace(/^\/+|\/+$/g, ""); // Remove leading/trailing slashes
          navigate(`/${sanitizedPath}`, { replace: true });
        }
      }
    }
  }, [location.search, navigate]);

  // PWA Install Prompt Handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user has previously dismissed the install prompt
      const dismissed = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY);
      if (!dismissed) {
        // Wait a few seconds before showing to let the user settle in
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      showSnackbarMessage("App installed successfully! 🎉", "success");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        showSnackbarMessage("Installing app...", "info");
      } else {
        showSnackbarMessage("Install cancelled", "info");
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "true");
    showSnackbarMessage(
      "You can install the app anytime from your browser menu",
      "info"
    );
  };

  const showSnackbarMessage = (
    message: string,
    severity: "success" | "info" | "warning" | "error"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  /**
   * Handle loading screen completion
   * Mark app as loaded to prevent showing loading screen on subsequent navigations
   */
  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
    sessionStorage.setItem("app-loaded", "true");
  };

  // Separate modal state for selection and profile/logout
  const [profileSelectionModalOpen, setProfileSelectionModalOpen] =
    useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [logoutConfirmChecked, setLogoutConfirmChecked] = useState(false);
  const {
    login,
    isAuthenticated,
    isAvailable: isGoogleAvailable,
    user,
    logout,
  } = useGoogleAuth();

  // Effect: Open profile selection modal if not authenticated and no profile mode
  useEffect(() => {
    const mode = localStorage.getItem("quizzard-profile-mode");
    if (!mode && !isAuthenticated) {
      setProfileSelectionModalOpen(true);
      setProfileModalOpen(false);
      console.log(
        "[ProfileSelectionModal Effect] Opening selection modal: not authenticated and no profile mode"
      );
    }
  }, [isAuthenticated, location]);

  // Handler for local-only mode
  const handleLocal = () => {
    localStorage.setItem("quizzard-profile-mode", "local");
    setProfileSelectionModalOpen(false);
  };

  // Handler for Google login
  const handleGoogle = async () => {
    if (!isGoogleAvailable) {
      showSnackbarMessage(
        "Google OAuth is not configured. Using local mode instead.",
        "warning"
      );
      handleLocal();
      return;
    }
    try {
      login();
      // Delay closing the modal to ensure popup is triggered
      setTimeout(() => setProfileSelectionModalOpen(false), 500);
    } catch (e) {
      console.error("[DEBUG] login() threw an error", e);
    }
  };

  // Handler for closing profile modal
  const handleProfileModalClose = () => {
    setProfileModalOpen(false);
    setLogoutConfirmChecked(false);
  };

  // Handler for profile/logout modal (from drawer)
  const handleProfileModalOpen = () => {
    if (isAuthenticated) {
      setProfileModalOpen(true);
      setProfileSelectionModalOpen(false);
    } else {
      setProfileSelectionModalOpen(true);
      setProfileModalOpen(false);
    }
  };

  // Debug log for user restoration
  useEffect(() => {
    console.log("[App] useGoogleAuth user:", user);
  }, [user]);

  // Handler for logout: call logout() to clear all profile keys, then reload
  const handleProfileLogout = () => {
    setProfileModalOpen(false);
    setLogoutConfirmChecked(false);
    logout(); // Clear all profile-related localStorage keys
    if (typeof window !== "undefined" && window.location) {
      window.location.reload();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Quick Loading Screen - only on app startup */}
      {showLoadingScreen && (
        <LoadingScreen
          onAnimationComplete={handleLoadingComplete}
          duration={1000} // Quick 1 second animation
        />
      )}

      {/* Main app container with proper flex layout */}
      <Box
        className="ios-width-safe"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh", // Set minimum height to fill viewport
          width: "100%",
          opacity: showLoadingScreen ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Header stays at the top */}
        <Header
          mode={mode}
          onThemeChange={handleThemeChange}
          onProfileModal={handleProfileModalOpen}
          onProfileSelection={() => setProfileSelectionModalOpen(true)}
          isAuthenticated={isAuthenticated}
          user={user}
          isGoogleAvailable={isGoogleAvailable}
        />

        {/* Profile Modal for signed-in users */}
        {profileModalOpen && isAuthenticated && (
          <Dialog
            open={profileModalOpen}
            onClose={handleProfileModalClose}
            maxWidth="xs"
            fullWidth
            aria-labelledby="profile-modal-title"
            PaperProps={{ sx: { borderRadius: 3, p: 2, zIndex: 2000 } }}
          >
            <DialogTitle
              id="profile-modal-title"
              sx={{ textAlign: "center", fontWeight: 700 }}
            >
              <Avatar
                alt={user?.name || "User"}
                src={user?.picture}
                sx={{ width: 48, height: 48, mx: "auto", mb: 1 }}
              />
              Hi{user?.name ? `, ${user.name}` : ""}!
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <strong>Thank you for using Quizzard.</strong>
              </Box>
              <Box sx={{ mb: 2 }}>
                If you leave your profile, we won't be able to save your quizzes
                to your own Drive for you to access later.
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={logoutConfirmChecked}
                    onChange={(e) => setLogoutConfirmChecked(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <span>
                    I understand that logging out will remove my cloud access.
                  </span>
                }
                sx={{ alignItems: "flex-start" }}
              />
            </DialogContent>
            <DialogActions
              sx={{ flexDirection: "column", gap: 1, px: 3, pb: 3 }}
            >
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={handleProfileLogout}
                disabled={!logoutConfirmChecked}
                aria-label="Log out"
              >
                Log out
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleProfileModalClose}
                aria-label="Close"
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Profile Selection Modal for sign in (always full flow) */}
        {console.log(
          "[JSX] Rendering ProfileSelectionModal, open=",
          profileSelectionModalOpen
        )}
        {profileSelectionModalOpen && !isAuthenticated && (
          <ProfileSelectionModal
            open={profileSelectionModalOpen}
            onLocal={handleLocal}
            onGoogle={handleGoogle}
          />
        )}

        {/* Content area that grows to fill available space */}
        <Box
          component="main"
          sx={{
            flexGrow: 1, // This makes it fill available space
            width: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default", // Theme-aware background
          }}
        >
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Home />
                  </Suspense>
                }
              />
              <Route
                path="/about"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <About />
                  </Suspense>
                }
              />
              <Route
                path="/privacy"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <PrivacyPolicy />
                  </Suspense>
                }
              />
              <Route
                path="/terms"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Terms />
                  </Suspense>
                }
              />
              <Route
                path="/contact"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Contact />
                  </Suspense>
                }
              />
              <Route
                path="/random-team-generator"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <RandomTeamGeneratorPage />
                  </Suspense>
                }
              />
              <Route
                path="/points-counter"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <PointsCounter />
                  </Suspense>
                }
              />
              <Route
                path="/quizzes"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Quizzes />
                  </Suspense>
                }
              />
              <Route
                path="/final-question"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <FinalQuestionPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Box>

        {/* Footer stays at the bottom */}
        <Footer />
      </Box>

      {/* PWA Install Prompt */}
      <Snackbar
        open={showInstallPrompt}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 8 }}
      >
        <Alert
          severity="info"
          sx={{
            width: "100%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "& .MuiAlert-icon": {
              color: "primary.contrastText",
            },
          }}
          icon={<InstallMobileIcon />}
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleInstallClick}
                sx={{ fontWeight: 600 }}
              >
                Install
              </Button>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleDismissInstall}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          Install Quizzard for the best experience!
        </Alert>
      </Snackbar>

      {/* Regular Snackbar for other messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
