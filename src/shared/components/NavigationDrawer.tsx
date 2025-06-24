/**
 * Navigation Drawer Component
 *
 * Comprehensive navigation drawer with app navigation links, external links,
 * theme selection, and Google OAuth login/logout functionality.
 *
 * Extracted from Header.tsx to improve maintainability and follow
 * the Single Responsibility Principle from development standards.
 *
 * Features:
 * - Complete app navigation (Home, About, Privacy, Terms, Contact)
 * - External links (GitHub, Support)
 * - Theme selection integration
 * - Google OAuth login/logout with user profile display
 * - Accessibility compliance with focus management
 * - Keyboard navigation support
 * - Proper ARIA labeling
 * - Close button positioned to match hamburger menu exactly
 *
 * @fileoverview Navigation drawer component with Google OAuth integration
 * @version 1.2.0
 * @since December 2025
 */

import React, { useRef, useEffect, useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  IconButton,
  Avatar,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
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
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SystemUpdateIcon from "@mui/icons-material/SystemUpdate";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAppUpdate } from "../hooks/useAppUpdate";
import { UpdateDialog } from "./UpdateDialog";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";

/**
 * Props for the NavigationDrawer component
 */
interface NavigationDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback to toggle drawer state */
  onClose: () => void;
  /** Current theme mode for theme icon display */
  currentTheme: "light" | "dark" | "system";
  /** Callback when theme button is clicked */
  onThemeDialogOpen: () => void;
  /** Google OAuth login function */
  onGoogleLogin: () => void;
  /** Google OAuth logout function */
  onGoogleLogout: () => void;
  /** Whether user is authenticated with Google */
  isAuthenticated: boolean;
  /** User profile information (if authenticated) */
  user: any;
  /** Whether Google OAuth is available/configured */
  isGoogleAvailable: boolean;
}

/**
 * Navigation Drawer Component
 *
 * Provides comprehensive app navigation with focus management and
 * accessibility features. Handles both internal routing and external links.
 */
const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  open,
  onClose,
  currentTheme,
  onThemeDialogOpen,
  onGoogleLogin,
  onGoogleLogout,
  isAuthenticated,
  user,
  isGoogleAvailable,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const updateState = useAppUpdate();

  // Focus management: focus close button when Drawer opens
  useEffect(() => {
    if (open && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [open]);

  // Trap focus inside Drawer when open
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  const handleUpdateClick = () => {
    setUpdateDialogOpen(true);
    onClose();
  };

  const handleLogoutClick = () => {
    onClose();
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    onGoogleLogout();
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        ref={drawerRef}
        sx={{
          zIndex: 1500, // Ensure drawer appears above modal content
          "& .MuiDrawer-paper": {
            width: 280,
            bgcolor: "background.paper",
            borderLeft: "1px solid",
            borderColor: "divider",
            zIndex: 1500, // Ensure paper also has high z-index
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Close button - positioned to match hamburger menu button exactly */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              minHeight: { xs: 40, sm: 48 }, // Match toolbar height from Header
              px: { xs: 1, sm: 2 }, // Match toolbar padding from Header
            }}
          >
            <IconButton
              onClick={onClose}
              ref={closeBtnRef}
              aria-label="Close navigation menu"
              color="inherit"
              sx={{
                padding: { xs: 0.25, sm: 0.5 }, // Match hamburger menu button padding
                minWidth: { xs: 36, sm: 44 }, // Match hamburger menu button size
                minHeight: { xs: 36, sm: 44 }, // Match hamburger menu button size
                "&:focus": { outline: "none" },
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
              <CloseRoundedIcon
                sx={{ fontSize: { xs: "1.75rem", sm: "2.1rem" } }} // Match hamburger menu icon size
              />
            </IconButton>
          </Box>

          <Divider />

          {/* Main Navigation */}
          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/" onClick={onClose}>
                <ListItemIcon>
                  <HomeRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/about" onClick={onClose}>
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/privacy" onClick={onClose}>
                <ListItemIcon>
                  <PrivacyTipIcon />
                </ListItemIcon>
                <ListItemText primary="Privacy Policy" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/terms" onClick={onClose}>
                <ListItemIcon>
                  <GavelIcon />
                </ListItemIcon>
                <ListItemText primary="Terms" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/contact" onClick={onClose}>
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

          {/* Settings */}
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleUpdateClick}>
                <ListItemIcon>
                  <SystemUpdateIcon />
                </ListItemIcon>
                <ListItemText primary="Check for Updates" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={onThemeDialogOpen}
                component="button"
                sx={{
                  "&:focus": { outline: "none" },
                  "&:focus-visible": { outline: "none" },
                }}
              >
                <ListItemIcon>
                  {currentTheme === "light" ? (
                    <LightModeIcon />
                  ) : currentTheme === "dark" ? (
                    <DarkModeIcon />
                  ) : (
                    <ComputerIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary="Theme" />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider />

          {/* Google Authentication Section */}
          <List>
            {isAuthenticated ? (
              <>
                {/* User Profile Display */}
                <ListItem disablePadding>
                  <ListItemButton
                    sx={{
                      "&:focus": { outline: "none" },
                      "&:focus-visible": { outline: "none" },
                      cursor: "default", // Not clickable, just display
                      "&:hover": { backgroundColor: "transparent" },
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        alt={user?.name || "User"}
                        src={user?.picture}
                        sx={{ width: 24, height: 24 }}
                      >
                        {!user?.picture && <AccountCircleIcon />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={user?.name || user?.email || "Google User"}
                      primaryTypographyProps={{
                        variant: "body2",
                        sx: { fontWeight: 500 },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {/* Logout Button */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleLogoutClick}
                    component="button"
                    sx={{
                      "&:focus": { outline: "none" },
                      "&:focus-visible": { outline: "none" },
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              /* Login Button - only shown when not authenticated */
              <ListItem disablePadding>
                <ListItemButton
                  onClick={onGoogleLogin}
                  component="button"
                  sx={{
                    "&:focus": { outline: "none" },
                    "&:focus-visible": { outline: "none" },
                  }}
                >
                  <ListItemIcon>
                    <LoginIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sign in with Google" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />

      <UpdateDialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        checking={updateState.checking}
        updateAvailable={updateState.updateAvailable}
        error={updateState.error}
        onCheckUpdate={updateState.checkForUpdate}
        onApplyUpdate={updateState.applyUpdate}
      />
    </>
  );
};

export default NavigationDrawer;
