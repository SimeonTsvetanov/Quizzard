/**
 * Navigation Drawer Component
 *
 * Comprehensive navigation drawer with app navigation links, external links,
 * and theme selection. Supports focus management and keyboard navigation.
 *
 * Extracted from Header.tsx to improve maintainability and follow
 * the Single Responsibility Principle from development standards.
 *
 * Features:
 * - Complete app navigation (Home, About, Privacy, Terms, Contact)
 * - External links (GitHub, Support)
 * - Theme selection integration
 * - Accessibility compliance with focus management
 * - Keyboard navigation support
 * - Proper ARIA labeling
 * - Close button positioned to match hamburger menu exactly
 *
 * @fileoverview Navigation drawer component
 * @version 1.1.0
 * @since December 2025
 */

import React, { useRef, useEffect } from "react";
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
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

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

  return (
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

        {/* Theme Selection */}
        <List>
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
      </Box>
    </Drawer>
  );
};

export default NavigationDrawer;
