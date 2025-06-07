import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import "./App.css";
import { useTheme } from "./shared/hooks/useTheme";
import Header from "./shared/components/Header";
import Footer from "./shared/components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import RandomTeamGeneratorPage from "./features/random-team-generator/pages/RandomTeamGeneratorPage";
import PointsCounter from "./features/pointsCounter/pages/PointsCounter";
import Quizzes from "./features/quizzes/pages/Quizzes";

function App() {
  // Use our custom theme hook instead of the logic that was here
  const { mode, theme, handleThemeChange } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    // Only process path params when the app loads with a search parameter
    if (location.search) {
      const queryParams = new URLSearchParams(location.search);
      const redirectedPath = queryParams.get("path");
      console.log("Redirected Path:", redirectedPath);

      if (redirectedPath !== null) {
        // Handle root path or regular paths
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Main app container with proper flex layout */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh", // Set minimum height to fill viewport
          width: "100%",
        }}
      >
        {/* Header stays at the top */}
        <Header mode={mode} onThemeChange={handleThemeChange} />

        {/* Content area that grows to fill available space */}
        <Box
          component="main"
          sx={{
            flexGrow: 1, // This makes it fill available space
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/team-generator" element={<RandomTeamGeneratorPage />} />
            <Route path="/points-counter" element={<PointsCounter />} />
            <Route path="/quizzes" element={<Quizzes />} />
          </Routes>
        </Box>

        {/* Footer stays at the bottom */}
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
