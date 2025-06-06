import { useEffect, useMemo, useState } from "react";
import { createTheme } from "@mui/material";

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
