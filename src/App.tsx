import { useMemo, useState } from "react";
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
  const [mode, setMode] = useState<"light" | "dark">(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
                primary: { main: "#FF6F61", contrastText: "#fff" },
                secondary: { main: "#FFD166", contrastText: "#222" },
                error: { main: "#D7263D", contrastText: "#fff" },
                warning: { main: "#F29E4C", contrastText: "#222" },
                info: { main: "#3A86FF", contrastText: "#fff" },
                success: { main: "#43AA8B", contrastText: "#fff" },
                background: { default: "#FFF8F0", paper: "#FFFFFF" },
                text: { primary: "#2D3142", secondary: "#595260" },
              }
            : {
                primary: { main: "#FFB4A2", contrastText: "#222" },
                secondary: { main: "#B5838D", contrastText: "#fff" },
                error: { main: "#FF6F61", contrastText: "#fff" },
                warning: { main: "#FFD166", contrastText: "#222" },
                info: { main: "#3A86FF", contrastText: "#fff" },
                success: { main: "#43AA8B", contrastText: "#fff" },
                background: { default: "#2D3142", paper: "#22223B" },
                text: { primary: "#FFF8F0", secondary: "#B5B5B5" },
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
          width: 1,
          maxWidth: 1,
          overflowX: "hidden",
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
              width: 1,
              maxWidth: 1,
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
