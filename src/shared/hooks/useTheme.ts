import { useEffect, useMemo, useState } from "react";
import { createTheme } from "@mui/material";

type ThemeMode = "light" | "dark";
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
          mode,
          ...(mode === "light"
            ? {
                primary: { main: "#1976D2", contrastText: "#fff" }, // Google Blue 700
                secondary: { main: "#9C27B0", contrastText: "#fff" }, // Google Purple 500
                error: { main: "#D32F2F", contrastText: "#fff" }, // Google Red 700
                warning: { main: "#FF9800", contrastText: "#212121" }, // Google Orange 500
                info: { main: "#2196F3", contrastText: "#fff" }, // Google Blue 500
                success: { main: "#4CAF50", contrastText: "#fff" }, // Google Green 500
                background: { default: "#FAFAFA", paper: "#FFFFFF" }, // Google Grey 50, White
                text: { primary: "#212121", secondary: "#757575" }, // Google Grey 900, Google Grey 600
              }
            : {
                primary: { main: "#64B5F6", contrastText: "#121212" }, // Google Blue 300
                secondary: { main: "#CE93D8", contrastText: "#121212" }, // Google Purple 200
                error: { main: "#EF9A9A", contrastText: "#121212" }, // Google Red 200
                warning: { main: "#FFCC80", contrastText: "#121212" }, // Google Orange 200
                info: { main: "#90CAF9", contrastText: "#121212" }, // Google Blue 200
                success: { main: "#A5D6A7", contrastText: "#121212" }, // Google Green 200
                background: { default: "#121212", paper: "#1E1E1E" }, // Very Dark Grey, Dark Grey
                text: { primary: "#FFFFFF", secondary: "#BDBDBD" }, // White, Google Grey 400
              }),
        },
        shape: { borderRadius: 12 },
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
