import { useEffect, useMemo, useState } from "react";
import { createTheme } from "@mui/material";
import "../types/theme.d.ts"; // Import theme type extensions for custom typography variants

type ThemeMode = "light" | "dark" | "system";
type ThemeSelection = ThemeMode | "system";

/**
 * Custom hook for managing theme state and preferences
 * @returns Theme related values and functions
 */
export const useTheme = () => {
  // Get the initial theme mode from localStorage or system preference
  const getInitialMode = (): ThemeMode => {
    const stored = localStorage.getItem("user-settings-theme-selection");
    if (stored === "light" || stored === "dark") return stored as ThemeMode;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };
  
  // State for the current theme mode
  const [mode, setMode] = useState<ThemeMode>(getInitialMode());

  // Save theme preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("user-settings-theme-selection", mode);
  }, [mode]);

  // Theme change handler function
  const handleThemeChange = (newTheme: ThemeSelection) => {
    if (newTheme === "system") {
      localStorage.removeItem("user-settings-theme-selection");
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setMode(systemTheme);
    } else {
      localStorage.setItem("user-settings-theme-selection", newTheme);
      setMode(newTheme);
    }
  };

  // Determine the palette mode for MUI (only 'light' or 'dark')
  const getPaletteMode = (mode: ThemeMode): "light" | "dark" => {
    if (mode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return mode;
  };

  // Create the theme object with proper configurations
  const theme = useMemo(
    () =>
      createTheme({
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
          },
        },
        palette: {
          mode: getPaletteMode(mode),
          ...(mode === "light"
            ? {
                // Material 3 Light Palette
                primary: { main: "#6750A4", contrastText: "#fff" }, // M3 Primary
                secondary: { main: "#625B71", contrastText: "#fff" }, // M3 Secondary
                tertiary: { main: "#7D5260", contrastText: "#fff" }, // M3 Tertiary
                error: { main: "#B3261E", contrastText: "#fff" },
                warning: { main: "#F9A825", contrastText: "#fff" },
                info: { main: "#00639B", contrastText: "#fff" },
                success: { main: "#2E7D32", contrastText: "#fff" },
                background: { default: "#FFFBFE", paper: "#FFFFFF" }, // M3 background/surface
                surface: { main: "#FFFBFE", contrastText: "#1C1B1F" },
                onSurface: { main: "#1C1B1F" },
                text: { primary: "#1C1B1F", secondary: "#49454F" },
              }
            : {
                // Material 3 Dark Palette
                primary: { main: "#D0BCFF", contrastText: "#381E72" },
                secondary: { main: "#CCC2DC", contrastText: "#332D41" },
                tertiary: { main: "#EFB8C8", contrastText: "#492532" },
                error: { main: "#F2B8B5", contrastText: "#601410" },
                warning: { main: "#FFD600", contrastText: "#332900" },
                info: { main: "#80D8FF", contrastText: "#00344F" },
                success: { main: "#81C784", contrastText: "#003916" },
                background: { default: "#1C1B1F", paper: "#232227" }, // M3 dark background/surface
                surface: { main: "#1C1B1F", contrastText: "#E6E1E5" },
                onSurface: { main: "#E6E1E5" },
                text: { primary: "#E6E1E5", secondary: "#CAC4D0" },
              }),
        },
        shape: { borderRadius: 12 },
        typography: {
          // Set Poppins as primary font with system font fallbacks
          fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
          // Enhanced typography scale with fluid scaling using clamp()
          h1: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', // Fluid scaling from 2rem to 3.5rem
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            marginBottom: '0.5em',
          },
          h2: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(1.75rem, 4vw, 2.8rem)', // Fluid scaling
            lineHeight: 1.25,
            letterSpacing: '-0.005em',
            marginBottom: '0.5em',
          },
          h3: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', // Fluid scaling
            lineHeight: 1.3,
            marginBottom: '0.5em',
          },
          h4: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(1.25rem, 2.5vw, 1.8rem)', // Fluid scaling
            lineHeight: 1.35,
            marginBottom: '0.5em',
          },
          h5: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', // Fluid scaling
            lineHeight: 1.4,
            marginBottom: '0.5em',
          },
          h6: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', // Fluid scaling
            lineHeight: 1.45,
            marginBottom: '0.5em',
          },
          body1: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', // Fluid body text
            lineHeight: 1.6,
            letterSpacing: '0.00938em',
          },
          body2: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(0.8rem, 1.2vw, 0.875rem)', // Smaller body text
            lineHeight: 1.6,
            letterSpacing: '0.01071em',
          },
          button: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(0.8rem, 1.2vw, 0.875rem)',
            lineHeight: 1.75,
            letterSpacing: '0.02857em',
            textTransform: 'none' as const, // Remove uppercase transformation
          },
          caption: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(0.7rem, 1vw, 0.75rem)',
            lineHeight: 1.66,
            letterSpacing: '0.03333em',
          },
          overline: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(0.7rem, 1vw, 0.75rem)',
            lineHeight: 2.66,
            letterSpacing: '0.08333em',
            textTransform: 'uppercase' as const,
          },
          // Quiz-specific typography variants for enhanced user experience
          // Following development standards for less padding/margins, more content focus
          quizTitle: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', // Prominent but not overwhelming
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            marginBottom: '0.75rem', // Reduced margin for more content space
            color: 'primary.main',
          },
          quizQuestion: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', // Optimized for readability
            lineHeight: 1.5,
            letterSpacing: '0.005em',
            marginBottom: '1rem',
            color: 'text.primary',
          },
          quizOption: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', // Clear distinction, easy scanning
            lineHeight: 1.6,
            letterSpacing: '0.00938em',
            padding: '0.5rem 0.75rem', // Reduced padding for more content
            marginBottom: '0.5rem',
            color: 'text.primary',
          },
          quizFeedback: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(0.9rem, 1.8vw, 1rem)', // Supportive, non-intrusive
            lineHeight: 1.6,
            letterSpacing: '0.00938em',
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            padding: '0.5rem', // Minimal padding
          },
          quizInstructions: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)', // Helper text, subtle but accessible
            lineHeight: 1.7,
            letterSpacing: '0.01071em',
            marginBottom: '0.75rem',
            color: 'text.secondary',
          },
          quizCounter: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)', // Clear progress indication
            lineHeight: 1.5,
            letterSpacing: '0.02857em',
            color: 'primary.main',
          },
          quizScore: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(1.5rem, 3vw, 2rem)', // Prominent score display
            lineHeight: 1.3,
            letterSpacing: '-0.005em',
            textAlign: 'center' as const,
            color: 'primary.main',
          },
        },
        transitions: {
          duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195,
          },
        },
        components: {
          MuiBackdrop: {
            styleOverrides: {
              root: {
                backdropFilter: "blur(1.5px)",
                WebkitBackdropFilter: "blur(1.5px)",
              },
            },
          },
        },
      }),
    [mode]
  );

  return {
    mode,
    theme,
    handleThemeChange,
  };
};
