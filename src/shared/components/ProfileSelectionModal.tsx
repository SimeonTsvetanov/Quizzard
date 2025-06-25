import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import { TermsContent } from "../../pages/Terms";
import { PrivacyPolicyContent } from "../../pages/PrivacyPolicy";
import Stack from "@mui/material/Stack";

/**
 * ProfileSelectionModal
 *
 * Modal dialog for selecting between local-only usage and Google profile login.
 * Shows info dialogs for Terms/Privacy when requested, without navigating away.
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

// Info dialog state type
const INFO_NONE = "none";
type InfoDialogType = typeof INFO_NONE | "terms" | "privacy";

const ProfileSelectionModal: React.FC<ProfileSelectionModalProps> = ({
  open,
  onLocal,
  onGoogle,
}) => {
  const { isAvailable: isGoogleAvailable } = useGoogleAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  // Track which info dialog is open (none | terms | privacy)
  const [infoDialog, setInfoDialog] = useState<InfoDialogType>(INFO_NONE);

  // On mount, check if already accepted
  useEffect(() => {
    setTermsAccepted(
      localStorage.getItem("quizzard-terms-accepted") === "true"
    );
  }, [open]);

  // When checked, store in localStorage
  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermsAccepted(e.target.checked);
    if (e.target.checked) {
      localStorage.setItem("quizzard-terms-accepted", "true");
    } else {
      localStorage.removeItem("quizzard-terms-accepted");
    }
  };

  // Wrap onGoogle to enforce acceptance
  const handleGoogle = () => {
    if (!termsAccepted) return;
    onGoogle();
  };

  // Handlers for info dialog open/close
  const openTermsInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    setInfoDialog("terms");
  };
  const openPrivacyInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    setInfoDialog("privacy");
  };
  const closeInfoDialog = () => setInfoDialog(INFO_NONE);

  return (
    <>
      {/* Main profile selection modal */}
      <Dialog
        open={open}
        aria-labelledby="profile-selection-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="profile-selection-title">
          <Typography
            variant="h1"
            align="center"
            sx={{
              fontSize: { xs: "2rem", sm: "2.5rem" },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Log In
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Would you like to use a profile and save information to your Google
            Drive, or use local storage only?
          </Typography>
          {/* New info: can always change profile mode later */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can always change your profile mode later from the menu.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Local Only:</strong> Data saved to browser storage. May be
            lost if browser data is cleared.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={handleCheckbox}
                name="termsAccepted"
                color="primary"
                inputProps={{ "aria-required": true }}
              />
            }
            label={
              <Typography variant="body2">
                I have read and agree to the{" "}
                {/* Replace links with buttons that open info dialogs */}
                <Button
                  variant="text"
                  size="small"
                  sx={{ textTransform: "none", p: 0, minWidth: 0 }}
                  onClick={openTermsInfo}
                  aria-label="Show Terms of Service"
                >
                  Terms of Service
                </Button>{" "}
                and{" "}
                <Button
                  variant="text"
                  size="small"
                  sx={{ textTransform: "none", p: 0, minWidth: 0 }}
                  onClick={openPrivacyInfo}
                  aria-label="Show Privacy Policy"
                >
                  Privacy Policy
                </Button>
                .
              </Typography>
            }
            sx={{ mt: 1, alignItems: "flex-start" }}
          />
        </DialogContent>
        <DialogActions sx={{ flexDirection: "column", gap: 1, px: 3, pb: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 2, justifyContent: "center" }}
          >
            <Button
              variant="outlined"
              color="secondary"
              fullWidth={false}
              onClick={onLocal}
              disabled={false}
              sx={{ minWidth: 120 }}
            >
              Local Only
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth={false}
              onClick={handleGoogle}
              disabled={!termsAccepted || !isGoogleAvailable}
              sx={{ minWidth: 120 }}
            >
              Google Login
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Info dialog for Terms/Privacy, shown on top of entry modal */}
      <Dialog
        open={infoDialog !== INFO_NONE}
        onClose={closeInfoDialog}
        aria-labelledby="info-dialog-title"
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle id="info-dialog-title">
          {infoDialog === "terms"
            ? "Terms of Service"
            : infoDialog === "privacy"
            ? "Privacy Policy"
            : ""}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 480, overflowY: "auto" }}>
          {infoDialog === "terms" && <TermsContent />}
          {infoDialog === "privacy" && <PrivacyPolicyContent />}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInfoDialog} color="primary" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfileSelectionModal;
