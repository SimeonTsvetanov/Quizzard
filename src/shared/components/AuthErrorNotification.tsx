import React from "react";
import { Alert, Snackbar } from "@mui/material";

interface AuthErrorNotificationProps {
  open: boolean;
  message: string;
  severity: "error" | "warning" | "info";
  onClose: () => void;
}

/**
 * Simple notification component for authentication-related errors and warnings
 * Used for token refresh failures and session management
 */
export const AuthErrorNotification: React.FC<AuthErrorNotificationProps> = ({
  open,
  message,
  severity,
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AuthErrorNotification;
