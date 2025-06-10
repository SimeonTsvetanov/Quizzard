import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useScrollTrigger,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import { Link, Link as RouterLink } from "react-router-dom";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InfoIcon from "@mui/icons-material/Info";
import GitHubIcon from "@mui/icons-material/GitHub";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ComputerIcon from "@mui/icons-material/Computer";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import GavelIcon from "@mui/icons-material/Gavel";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import { useState, useRef, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

interface HeaderProps {
  mode: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

/**
 * Header Component
 * 
 * Application header with logo, app name, and hamburger menu navigation.
 * Uses hamburger menu for all screen sizes to maintain consistent UX
 * across mobile and desktop. Includes comprehensive navigation links,
 * theme selection, and external links.
 * 
 * Features:
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<"light" | "dark" | "system">(
    mode === "light" || mode === "dark" ? mode : "system"
  );
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const themeBtnRef = useRef<HTMLButtonElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const prevMode = useRef(mode);

  // Focus management: focus close button when Drawer opens
  useEffect(() => {
    if (drawerOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [drawerOpen]);

  // Trap focus inside Drawer when open
  useEffect(() => {
    if (!drawerOpen) return;
    const drawerNode = drawerRef.current;
    if (!drawerNode) return;
    const focusableSelectors = [
      "button",
      "[href]",
      "input",
      "select",
      "textarea",
      '[tabindex]:not([tabindex="-1"])',
    ];
    const getFocusable = () =>
      drawerNode.querySelectorAll<HTMLElement>(focusableSelectors.join(","));
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusable = Array.from(getFocusable());
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    drawerNode.addEventListener("keydown", handleKeyDown);
    return () => drawerNode.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  const handleDrawerToggle = () => setDrawerOpen((open) => !open);
  const handleThemeMenuClick = () => {
    setThemeDialogOpen(true);
  };
  const handleThemeDialogClose = (apply = false) => {
    setThemeDialogOpen(false);
    if (apply) {
      if (pendingTheme !== prevMode.current) {
        onThemeChange(pendingTheme);
        setSnackbarOpen(true);
        prevMode.current = pendingTheme;
      }
      // Close drawer if open
      if (drawerOpen) setDrawerOpen(false);
    } else {
      setPendingTheme(mode);
    }
    setTimeout(() => {
      if (themeBtnRef.current) themeBtnRef.current.blur();
    }, 0);
  };

  return (
    <AppBar
      position="sticky"
      elevation={
        useScrollTrigger({ disableHysteresis: true, threshold: 0 }) ? 4 : 0
      }
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
          <HomeRoundedIcon sx={{ fontSize: { xs: '1.75rem', sm: '2.1rem' } }} />
        </IconButton>

        {/* Centered QUIZZARD Text (non-clickable) */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2.1rem' },
              background: 'linear-gradient(45deg, #1976d2, #42a5f5, #1976d2, #42a5f5)',
              backgroundSize: '400% 400%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              animation: 'shimmer 3s ease-in-out infinite',
              '@keyframes shimmer': {
                '0%': {
                  backgroundPosition: '0% 50%'
                },
                '50%': {
                  backgroundPosition: '100% 50%'
                },
                '100%': {
                  backgroundPosition: '0% 50%'
                }
               },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            QUIZZARD
          </Typography>
        </Box>
        {/* Hamburger Menu - Always visible for consistent UX */}
        <Box
          sx={{
            display: "flex",
            flexShrink: 0,
            ml: 0,
          }}
        >
          <IconButton
            color="inherit"
            edge="end"
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
            <MenuOpenRoundedIcon sx={{ fontSize: { xs: '1.75rem', sm: '2.1rem' } }} />
          </IconButton>
        </Box>
      </Toolbar>
      {/* Drawer for navigation menu */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        transitionDuration={300}
        PaperProps={{
          id: "quizzard-mobile-drawer",
          role: "dialog",
          "aria-modal": true,
          "aria-labelledby": "drawer-title",
          ref: drawerRef,
        }}
      >
        <Box
          sx={{
            width: 250,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
          role="presentation"
        >
          {/* Close button for accessibility */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
            <IconButton
              onClick={handleDrawerToggle}
              aria-label="Close menu"
              ref={closeBtnRef}
              tabIndex={0}
              sx={{
                padding: 1.5,
                minWidth: 48,
                minHeight: 48,
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
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Box>
            </IconButton>
          </Box>
          <Divider />
          {/* Main Navigation */}
          <List>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/"
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>
                  <HomeRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/about"
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/privacy"
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>
                  <PrivacyTipIcon />
                </ListItemIcon>
                <ListItemText primary="Privacy Policy" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/terms"
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>
                  <GavelIcon />
                </ListItemIcon>
                <ListItemText primary="Terms" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/contact"
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>
                  <ContactMailIcon />
                </ListItemIcon>
                <ListItemText primary="Contact" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component="a"
                href="https://github.com/SimeonTsvetanov"
                target="_blank"
                rel="noopener"
              >
                <ListItemIcon>
                  <GitHubIcon />
                </ListItemIcon>
                <ListItemText primary="GitHub" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component="a"
                href="https://buymeacoffee.com/simeontsvetanov"
                target="_blank"
                rel="noopener"
              >
                <ListItemIcon>
                  <LocalCafeIcon />
                </ListItemIcon>
                <ListItemText primary="Support Me" />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider />
          {/* Theme Selection */}
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleThemeMenuClick}
                component="button"
                sx={{
                  "&:focus": { outline: "none" },
                  "&:focus-visible": { outline: "none" }, // Remove focus border
                }}
              >
                <ListItemIcon>
                  {mode === "light" ? (
                    <LightModeIcon />
                  ) : mode === "dark" ? (
                    <DarkModeIcon />
                  ) : (
                    <ComputerIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary="Theme" />
              </ListItemButton>
            </ListItem>
          </List>
          {/* Spacer for full height, for better touch targets */}
          <Box sx={{ flexGrow: 1 }} />
        </Box>
      </Drawer>
      {/* Theme Selection Dialog */}
      <Dialog
        open={themeDialogOpen}
        onClose={() => handleThemeDialogClose(false)}
        aria-labelledby="theme-dialog-title"
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle
          id="theme-dialog-title"
          sx={{ textAlign: "center", fontWeight: 700 }}
        >
          Select Theme
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Button
              variant={pendingTheme === "light" ? "contained" : "text"}
              color="primary"
              startIcon={<LightModeIcon />}
              fullWidth
              onClick={() => setPendingTheme("light")}
              sx={{
                justifyContent: "flex-start",
                fontWeight: 500,
                boxShadow: pendingTheme === "light" ? 2 : 0,
                border: "none",
                '&:focus': { outline: 'none' },
                '&:focus-visible': { outline: 'none' },
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
              aria-pressed={pendingTheme === "light"}
            >
              Light
            </Button>
            <Button
              variant={pendingTheme === "dark" ? "contained" : "text"}
              color="secondary"
              startIcon={<DarkModeIcon />}
              fullWidth
              onClick={() => setPendingTheme("dark")}
              sx={{
                justifyContent: "flex-start",
                fontWeight: 500,
                boxShadow: pendingTheme === "dark" ? 2 : 0,
                border: "none",
                '&:focus': { outline: 'none' },
                '&:focus-visible': { outline: 'none' },
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
              aria-pressed={pendingTheme === "dark"}
            >
              Dark
            </Button>
            <Button
              variant={pendingTheme === "system" ? "contained" : "text"}
              color="info"
              startIcon={<ComputerIcon />}
              fullWidth
              onClick={() => setPendingTheme("system")}
              sx={{
                justifyContent: "flex-start",
                fontWeight: 500,
                boxShadow: pendingTheme === "system" ? 2 : 0,
                border: "none",
                '&:focus': { outline: 'none' },
                '&:focus-visible': { outline: 'none' },
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
              aria-pressed={pendingTheme === "system"}
            >
              System
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pt: 2 }}>
          <Button
            onClick={() => handleThemeDialogClose(true)}
            variant="contained"
            color="primary"
            sx={{
              minWidth: 120,
              fontWeight: 600,
              '&:focus': { outline: 'none' },
              '&:focus-visible': { outline: 'none' },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for theme change confirmation */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Theme changed!
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default Header;
