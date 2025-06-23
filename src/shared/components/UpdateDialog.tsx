/**
 * Update Dialog Component
 *
 * Dialog for checking and applying app updates.
 * Shows loading state, update availability, and error messages.
 *
 * @fileoverview Update dialog component
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  Fade,
  Grow,
} from "@mui/material";
import SystemUpdateIcon from "@mui/icons-material/SystemUpdate";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

interface UpdateDialogProps {
  open: boolean;
  onClose: () => void;
  checking: boolean;
  updateAvailable: boolean;
  error: string | null;
  onCheckUpdate: () => void;
  onApplyUpdate: () => void;
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  open,
  onClose,
  checking,
  updateAvailable,
  error,
  onCheckUpdate,
  onApplyUpdate,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="update-dialog-title"
      maxWidth="xs"
      fullWidth
      TransitionProps={{ timeout: 400 }}
    >
      <DialogTitle id="update-dialog-title">Check for Updates</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 2,
            minHeight: 160,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Loading State */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: checking ? 1 : 0,
              transform: checking ? "translateY(0)" : "translateY(-20px)",
              transition: "all 0.3s ease-in-out",
              visibility: checking ? "visible" : "hidden",
            }}
          >
            <CircularProgress size={56} thickness={4} />
            <Typography
              variant="body1"
              sx={{
                mt: 3,
                fontWeight: 500,
                opacity: checking ? 1 : 0,
                transform: checking ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.2s ease-in-out",
                transitionDelay: "0.1s",
              }}
            >
              Checking for updates...
            </Typography>
          </Box>

          {/* Result State */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: checking ? 0 : 1,
              transform: checking ? "translateY(20px)" : "translateY(0)",
              transition: "all 0.3s ease-in-out",
              visibility: checking ? "hidden" : "visible",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: checking ? 0 : 1,
                transform: checking ? "scale(0.9)" : "scale(1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {error ? (
                <>
                  <ErrorIcon color="error" sx={{ fontSize: 56 }} />
                  <Typography
                    variant="body1"
                    color="error"
                    sx={{ mt: 3, fontWeight: 500, textAlign: "center" }}
                  >
                    {error}
                  </Typography>
                </>
              ) : updateAvailable ? (
                <>
                  <SystemUpdateIcon color="primary" sx={{ fontSize: 56 }} />
                  <Typography
                    variant="body1"
                    sx={{ mt: 3, fontWeight: 500, color: "primary.main" }}
                  >
                    An update is available!
                  </Typography>
                </>
              ) : (
                <>
                  <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
                  <Typography
                    variant="body1"
                    sx={{ mt: 3, fontWeight: 500, color: "success.main" }}
                  >
                    You're up to date!
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!checking && (
          <>
            {updateAvailable ? (
              <Button
                onClick={onApplyUpdate}
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SystemUpdateIcon />}
                sx={{ minWidth: 120 }}
              >
                Update Now
              </Button>
            ) : (
              <Button
                onClick={onCheckUpdate}
                color="primary"
                size="large"
                sx={{ minWidth: 120 }}
              >
                Check Again
              </Button>
            )}
            <Button onClick={onClose} size="large">
              Close
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
