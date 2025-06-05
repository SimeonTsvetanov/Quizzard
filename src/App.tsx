import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import About from "./components/About";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Terms from "./components/Terms";
import Contact from "./components/Contact";
import RandomTeamGenerator from "./components/RandomTeamGenerator";
import PointsCounter from "./components/PointsCounter";

function App() {
  const getInitialMode = () => {
    const stored = localStorage.getItem("user-settings-theme-selection");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const [mode, setMode] = useState<"light" | "dark">(getInitialMode());
  useEffect(() => {
    localStorage.setItem("user-settings-theme-selection", mode);
  }, [mode]);

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
                backdropFilter: "blur(1.5px)", // Further reduced blur for a very subtle effect
                WebkitBackdropFilter: "blur(1.5px)",
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          // Removed overflowX: 'hidden' to allow sticky AppBar
        }}
      >
        <BrowserRouter basename="/Quizzard">
          <Header
            mode={mode}
            onToggleMode={() => setMode(mode === "light" ? "dark" : "light")}
          />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              width: "100%",
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/team-generator" element={<RandomTeamGenerator />} />
              <Route path="/points-counter" element={<PointsCounter />} />
            </Routes>
          </Box>
          <Footer />
        </BrowserRouter>
      </Box>
    </ThemeProvider>
  );
}

export default App;
