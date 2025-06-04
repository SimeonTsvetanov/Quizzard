import { useMemo, useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Paper,
  Box,
  Button,
  Typography,
} from "@mui/material";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import About from "./components/About";

function App() {
  const [mode, setMode] = useState<"light" | "dark">(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  // Listen for hash changes to enable navigation
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
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
      <Header
        mode={mode}
        onToggleMode={() => setMode(mode === "light" ? "dark" : "light")}
      />
      <main style={{ flex: 1 }}>
        {/* Simple route simulation for About page */}
        {currentHash === "#about" ? (
          <About />
        ) : (
          <Container maxWidth="sm" sx={{ mt: 6 }}>
            <Paper
              elevation={3}
              sx={{ p: 4, textAlign: "center", overflow: "hidden" }}
            >
              <Typography variant="h4" gutterBottom>
                Welcome to Quizzard
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Your all-in-one quiz and team tools suite
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mt: 4,
                  width: "100%",
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled
                  sx={{ minWidth: 0, wordBreak: "break-word" }}
                >
                  Random Team Generator (Coming Soon)
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  disabled
                  sx={{ minWidth: 0, wordBreak: "break-word" }}
                >
                  Points Counter (Coming Soon)
                </Button>
              </Box>
            </Paper>
          </Container>
        )}
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
