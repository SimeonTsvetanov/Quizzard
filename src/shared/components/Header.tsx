import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  useScrollTrigger,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { useState } from "react";
import { NavigationDrawer } from "./NavigationDrawer";
import { ThemeSelectionDialog } from "./ThemeSelectionDialog";
import { getDynamicHeaderText } from "../utils/headerUtils";

interface HeaderProps {
  mode: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

/**
 * Header Component
 *
 * Application header with dynamic text, logo, and hamburger menu navigation.
 * Features dynamic text that changes based on current route with responsive
 * font sizing to ensure text always fits between icons on all screen sizes.
 * Uses hamburger menu for all screen sizes to maintain consistent UX
 * across mobile and desktop.
 *
 * Dynamic Text Mappings:
 * - Home (/): "QUIZZARD" - Standard size
 * - Random Team Generator: "RANDOM GENERATOR" - Compact size for mobile
 * - Points Counter: "POINTS COUNTER" - Medium size
 * - Quizzes: "QUIZZES" - Standard size
 *
 * Features:
 * - Route-based dynamic header text with responsive sizing
 * - Always-visible hamburger menu (all screen sizes)
 * - Comprehensive navigation: Home, About, Privacy, Terms, Contact, GitHub, Support
 * - Theme selection dialog with light/dark/system options
 * - Focus management and keyboard navigation
 * - Responsive design following PWA-first principles
 * - Accessibility compliance with ARIA labels and roles
 *
 * @param mode - Current theme mode (light/dark/system)
 * @param onThemeChange - Callback for theme changes
 */
const Header = ({ mode, onThemeChange }: HeaderProps) => {
  const location = useLocation();
  const theme = useTheme();
  const dynamicHeader = getDynamicHeaderText(location.pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const handleDrawerClose = () => setDrawerOpen(false);
  const handleThemeDialogOpen = () => setThemeDialogOpen(true);
  const handleThemeDialogClose = () => setThemeDialogOpen(false);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    onThemeChange(newTheme);
    setThemeDialogOpen(false);
    setDrawerOpen(false);
  };

  return (
    <AppBar
      position="sticky"
      elevation={
        useScrollTrigger({ disableHysteresis: true, threshold: 0 }) ? 4 : 0
      }
      className="ios-safe-header ios-safe-left ios-safe-right"
      sx={{
        bgcolor: theme.palette.background.default, // Match main body background
        color: theme.palette.text.primary,
        top: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        transition: theme.transitions.create(
          ["box-shadow", "background-color"],
          {
            duration: theme.transitions.duration.short,
          }
        ),
      }}
    >
      <Toolbar
        sx={{
          width: "100%",
          maxWidth: "100%",
          px: { xs: 1, sm: 2 },
          minHeight: { xs: 40, sm: 48 },
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Home Icon on Left */}
        <IconButton
          component={RouterLink}
          to="/"
          color="inherit"
          aria-label="Home"
          sx={{
            padding: { xs: 0.25, sm: 0.5 },
            minWidth: { xs: 36, sm: 44 },
            minHeight: { xs: 36, sm: 44 },
            mr: 0,
            "&:focus": {
              outline: "none",
            },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.08)",
            },
          }}
        >
          <HomeRoundedIcon sx={{ fontSize: { xs: "1.75rem", sm: "2.1rem" } }} />
        </IconButton>

        {/* Centered Dynamic Text (non-clickable) - Route-based with responsive sizing */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minWidth: 0,
            overflow: "hidden",
            // Ensure proper spacing from icons
            mx: { xs: 0.5, sm: 1 },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              // Font family provided by theme - no manual override needed
              fontWeight: 700,
              fontSize: dynamicHeader.fontSize, // Dynamic responsive sizing based on route

              // Perfect vertical centering
              margin: 0,
              lineHeight: 1,

              // Shimmer animation effect
              background:
                "linear-gradient(45deg, #1976d2, #42a5f5, #1976d2, #42a5f5)",
              backgroundSize: "400% 400%",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              animation: "shimmer 3s ease-in-out infinite",
              "@keyframes shimmer": {
                "0%": {
                  backgroundPosition: "0% 50%",
                },
                "50%": {
                  backgroundPosition: "100% 50%",
                },
                "100%": {
                  backgroundPosition: "0% 50%",
                },
              },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center",
              // Ensure text fits between icons with proper constraints
              maxWidth: "calc(100% - 16px)", // Account for margins
            }}
          >
            {dynamicHeader.text}
          </Typography>
        </Box>
        {/* Hamburger Menu - Always visible for consistent UX */}
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={handleDrawerToggle}
          aria-haspopup="true"
          aria-controls="quizzard-mobile-drawer"
          sx={{
            padding: { xs: 0.25, sm: 0.5 },
            minWidth: { xs: 36, sm: 44 },
            minHeight: { xs: 36, sm: 44 },
            "&:focus": {
              outline: "none",
            },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
            "& .MuiTouchRipple-root": {
              display: "none",
            },
            "&::after": {
              display: "none",
            },
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.08)",
            },
          }}
        >
          <MenuOpenRoundedIcon
            sx={{ fontSize: { xs: "1.75rem", sm: "2.1rem" } }}
          />
        </IconButton>
      </Toolbar>

      {/* Navigation Drawer */}
      <NavigationDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onThemeDialogOpen={handleThemeDialogOpen}
        currentTheme={mode}
      />

      {/* Theme Selection Dialog */}
      <ThemeSelectionDialog
        open={themeDialogOpen}
        onClose={handleThemeDialogClose}
        currentTheme={mode}
        onThemeChange={handleThemeChange}
      />
    </AppBar>
  );
};

export default Header;
