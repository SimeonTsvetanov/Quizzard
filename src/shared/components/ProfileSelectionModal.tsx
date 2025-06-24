import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useGoogleAuth } from "../hooks/useGoogleAuth";

/**
 * ProfileSelectionModal
 *
 * Modal dialog for selecting between local-only usage and Google profile login.
 * Automatically detects if Google OAuth is properly configured and adjusts UI accordingly.
 *
 * Props:
 * - open: boolean (controls modal visibility)
 * - onLocal: () => void (called when user chooses local usage)
 * - onGoogle: () => void (called when user chooses Google login)
 */
export interface ProfileSelectionModalProps {
  open: boolean;
  onLocal: () => void;
  onGoogle: () => void;
}

const ProfileSelectionModal: React.FC<ProfileSelectionModalProps> = ({
  open,
  onLocal,
  onGoogle,
}) => {
  const { isAvailable: isGoogleAvailable } = useGoogleAuth();

  return (
    <Dialog
      open={open}
      aria-labelledby="profile-selection-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="profile-selection-title">
        Choose Profile Mode
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Would you like to use a profile and save information to your Google
          Drive, or use local storage only?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <strong>Local Mode:</strong> Data saved to browser storage. May be
          lost if browser data is cleared.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Google Mode:</strong> Data saved to your Google Drive for
          backup and sync across devices.
          {!isGoogleAvailable && (
            <span
              style={{ color: "orange", display: "block", marginTop: "8px" }}
            >
              ⚠️ Google OAuth not configured - will use local mode
            </span>
          )}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexDirection: "column", gap: 1, px: 3, pb: 3 }}>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={onLocal}
          aria-label="Use local storage only"
        >
          Use Local Mode
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={onGoogle}
          disabled={!isGoogleAvailable}
          aria-label={
            isGoogleAvailable
              ? "Sign in with Google"
              : "Google OAuth not available"
          }
        >
          {isGoogleAvailable ? "Use Google Mode" : "Google Mode (Unavailable)"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileSelectionModal;
