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
import { Link, Link as RouterLink, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import GitHubIcon from "@mui/icons-material/GitHub";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ComputerIcon from "@mui/icons-material/Computer";
import { useState, useRef, useEffect } from "react";
import quizzardLogo from "../assets/quizzard-logo.png";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

interface HeaderProps {
  mode: "light" | "dark";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

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
  const location = useLocation();
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
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        {" "}
        {/* Logo and App Name (clickable) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
          component={RouterLink}
          to="/"
        >
          <Box
            component="img"
            src={quizzardLogo}
            alt="Quizzard Logo"
            sx={{
              height: { xs: 40, sm: 48 },
              width: "auto",
              maxWidth: { xs: 40, sm: 48 },
              objectFit: "contain",
              mr: 1,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              textDecoration: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Quizzard
          </Typography>
        </Box>
        {/* Desktop Nav Links */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Button
            variant={location.pathname === "/" ? "contained" : "text"}
            color="primary"
            startIcon={<HomeIcon />}
            component={Link}
            to="/"
            sx={{
              transition: theme.transitions.create(["background-color", "box-shadow", "color"], { duration: theme.transitions.duration.short }),
              fontWeight: location.pathname === "/" ? 700 : 500,
              '&:hover': {
                backgroundColor: location.pathname === "/" ? theme.palette.primary.main : theme.palette.action.hover,
                color: theme.palette.primary.contrastText,
              },
            }}
          >
            Home
          </Button>
          <Button
            variant={location.pathname === "/about" ? "contained" : "text"}
            color="primary"
            startIcon={<InfoIcon />}
            component={Link}
            to="/about"
            sx={{
              transition: theme.transitions.create(["background-color", "box-shadow", "color"], { duration: theme.transitions.duration.short }),
              fontWeight: location.pathname === "/about" ? 700 : 500,
              '&:hover': {
                backgroundColor: location.pathname === "/about" ? theme.palette.primary.main : theme.palette.action.hover,
                color: theme.palette.primary.contrastText,
              },
            }}
          >
            About
          </Button>
          <Button
            color="inherit"
            startIcon={<GitHubIcon />}
            component="a"
            href="https://github.com/SimeonTsvetanov"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </Button>
          <Button
            color="inherit"
            startIcon={<LocalCafeIcon />}
            component="a"
            href="https://buymeacoffee.com/simeontsvetanov"
            target="_blank"
            rel="noopener"
          >
            Support Me
          </Button>
          <Button
            color="inherit"
            startIcon={
              <>
                {mode === "light" ? (
                  <LightModeIcon />
                ) : mode === "dark" ? (
                  <DarkModeIcon />
                ) : (
                  <ComputerIcon />
                )}
              </>
            }
            onClick={handleThemeMenuClick}
            aria-label="Theme selection"
            ref={themeBtnRef}
            sx={{
              '&:focus': { outline: 'none' },
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            Theme
          </Button>
        </Box>
        {/* Hamburger for mobile */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            flexShrink: 0,
            ml: 1,
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
              padding: { xs: 1.5, sm: 1 },
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
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              },
            }}
          >
            <MenuIcon sx={{ fontSize: { xs: 28, sm: 24 } }} />
          </IconButton>
        </Box>
      </Toolbar>
      {/* Drawer for mobile menu */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          id: "quizzard-mobile-drawer",
          role: "dialog",
          "aria-modal": true,
          "aria-labelledby": "drawer-title",
          ref: drawerRef,
          sx: { transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)" }, // subtle animation
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
          <List>
            <ListItem disablePadding>
              {" "}
              <ListItemButton
                component={Link}
                to=""
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>
                  <HomeIcon />
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
