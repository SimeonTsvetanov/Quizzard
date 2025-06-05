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
} from "@mui/material";
import { Link, Link as RouterLink } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import GitHubIcon from "@mui/icons-material/GitHub";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useState, useRef, useEffect } from "react";
import quizzardLogo from "../assets/quizzard-logo.png";

interface HeaderProps {
  mode: "light" | "dark";
  onToggleMode: () => void;
}

const Header = ({ mode, onToggleMode }: HeaderProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

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
              color: "inherit",
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
            color="inherit"
            startIcon={<HomeIcon />}
            component={Link}
            to="/"
          >
            Home
          </Button>
          <Button
            color="inherit"
            startIcon={<InfoIcon />}
            component={Link}
            to="/about"
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
          <IconButton
            color="inherit"
            onClick={onToggleMode}
            aria-label="Toggle theme"
          >
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
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
              <ListItemButton
                component={Link}
                to="/"
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
              <ListItemButton onClick={onToggleMode} component="button">
                <ListItemIcon>
                  {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={mode === "light" ? "Dark Mode" : "Light Mode"}
                />
              </ListItemButton>
            </ListItem>
          </List>
          {/* Spacer for full height, for better touch targets */}
          <Box sx={{ flexGrow: 1 }} />
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header;
