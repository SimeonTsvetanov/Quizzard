/**
 * Theme Selection Dialog Component
 *
 * Modal dialog for selecting application theme with light/dark/system options.
 * Provides intuitive theme switching with visual indicators and confirmation.
 *
 * Extracted from Header.tsx to improve maintainability and follow
 * the Single Responsibility Principle from development standards.
 *
 * Features:
 * - Three theme options: Light, Dark, System
 * - Visual selection indicators with proper colors
 * - Accessible dialog with proper ARIA labels
 * - Smooth transitions and clean design
 * - Confirmation-based theme application
 *
 * @fileoverview Theme selection dialog component
 * @version 1.0.0
 * @since December 2025
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Button,
  useTheme,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ComputerIcon from "@mui/icons-material/Computer";

/**
 * Props for the ThemeSelectionDialog component
 */
interface ThemeSelectionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Currently selected theme */
  currentTheme: "light" | "dark" | "system";
  /** Callback when theme selection changes */
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

/**
 * Theme Selection Dialog Component
 *
 * Provides an intuitive interface for users to select their preferred
 * application theme with immediate visual feedback.
 */
export const ThemeSelectionDialog: React.FC<ThemeSelectionDialogProps> = ({
  open,
  onClose,
  currentTheme,
  onThemeChange,
}) => {
  const theme = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<
    "light" | "dark" | "system"
  >(currentTheme);

  const handleThemeSelect = (newTheme: "light" | "dark" | "system") => {
    setSelectedTheme(newTheme);
  };

  const handleApply = () => {
    onThemeChange(selectedTheme);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            variant={selectedTheme === "light" ? "contained" : "text"}
            color="primary"
            startIcon={<LightModeIcon />}
            fullWidth
            onClick={() => handleThemeSelect("light")}
            sx={{
              justifyContent: "flex-start",
              fontWeight: 500,
              boxShadow: selectedTheme === "light" ? 2 : 0,
              border: "none",
              "&:focus": { outline: "none" },
              "&:focus-visible": { outline: "none" },
              transition: "background 0.2s, box-shadow 0.2s",
            }}
            aria-pressed={selectedTheme === "light"}
          >
            Light
          </Button>

          <Button
            variant={selectedTheme === "dark" ? "contained" : "text"}
            color="secondary"
            startIcon={<DarkModeIcon />}
            fullWidth
            onClick={() => handleThemeSelect("dark")}
            sx={{
              justifyContent: "flex-start",
              fontWeight: 500,
              boxShadow: selectedTheme === "dark" ? 2 : 0,
              border: "none",
              "&:focus": { outline: "none" },
              "&:focus-visible": { outline: "none" },
              transition: "background 0.2s, box-shadow 0.2s",
            }}
            aria-pressed={selectedTheme === "dark"}
          >
            Dark
          </Button>

          <Button
            variant={selectedTheme === "system" ? "contained" : "text"}
            color="info"
            startIcon={<ComputerIcon />}
            fullWidth
            onClick={() => handleThemeSelect("system")}
            sx={{
              justifyContent: "flex-start",
              fontWeight: 500,
              boxShadow: selectedTheme === "system" ? 2 : 0,
              border: "none",
              "&:focus": { outline: "none" },
              "&:focus-visible": { outline: "none" },
              transition: "background 0.2s, box-shadow 0.2s",
            }}
            aria-pressed={selectedTheme === "system"}
          >
            System
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pt: 2 }}>
        <Button
          onClick={handleApply}
          variant="contained"
          color="primary"
          sx={{
            minWidth: 120,
            fontWeight: 600,
            "&:focus": { outline: "none" },
            "&:focus-visible": { outline: "none" },
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
