import { useMemo, useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Container,
  Paper,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import "./App.css";

function App() {
  const [mode, setMode] = useState<"light" | "dark">(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
        shape: { borderRadius: 12 },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Quizzard
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => setMode(mode === "light" ? "dark" : "light")}
          >
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Quizzard
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Your all-in-one quiz and team tools suite
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled
            >
              Random Team Generator (Coming Soon)
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              disabled
            >
              Points Counter (Coming Soon)
            </Button>
          </Box>
        </Paper>
      </Container>
      <Box
        component="footer"
        sx={{ mt: 8, py: 2, textAlign: "center", color: "text.secondary" }}
      >
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} Quizzard. All rights reserved.
        </Typography>
      </Box>
    </ThemeProvider>
  );
}

export default App;
