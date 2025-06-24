/**
 * Logout Confirmation Dialog
 *
 * Displays a warning dialog when user attempts to log out, explaining
 * that their data is stored locally and asking for confirmation.
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  useTheme,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import StorageIcon from "@mui/icons-material/Storage";

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
      maxWidth="sm"
      fullWidth
      sx={{
        position: "fixed",
        zIndex: theme.zIndex.modal,
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 2,
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle id="logout-dialog-title" sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <LogoutIcon color="warning" />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Confirm Logout
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" icon={<StorageIcon />} sx={{ mb: 2 }}>
          Your quizzes, teams, and other data are stored locally in your
          browser.
        </Alert>

        <Typography id="logout-dialog-description" gutterBottom>
          Are you sure you want to log out? You will need to log in again to:
        </Typography>

        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <Typography component="li">Access your Google profile</Typography>
          <Typography component="li">
            Use Google Drive integration (when available)
          </Typography>
          <Typography component="li">
            Sync data across devices (when available)
          </Typography>
        </Box>

        <Typography sx={{ mt: 2 }} color="text.secondary">
          Note: Your local data will remain available even after logging out.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ pt: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{
            fontWeight: 500,
            "&:focus": { outline: "none" },
            "&:focus-visible": { outline: "none" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="warning"
          variant="contained"
          startIcon={<LogoutIcon />}
          sx={{
            fontWeight: 600,
            "&:focus": { outline: "none" },
            "&:focus-visible": { outline: "none" },
          }}
        >
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  );
};
