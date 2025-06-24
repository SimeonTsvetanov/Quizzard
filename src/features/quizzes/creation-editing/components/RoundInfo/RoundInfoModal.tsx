import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { roundInfoContent } from "./roundInfoContent";

/**
 * Props for RoundInfoModal
 */
export interface RoundInfoModalProps {
  open: boolean;
  onClose: () => void;
  roundType:
    | "mixed"
    | "single-answer"
    | "multiple-choice"
    | "picture"
    | "audio"
    | "video"
    | "golden-pyramid";
}

/**
 * RoundInfoModal
 *
 * Displays a user-friendly explanation of the selected round type.
 * Accessible, keyboard navigable, and dismissible.
 *
 * @param props - RoundInfoModalProps
 */
export const RoundInfoModal: React.FC<RoundInfoModalProps> = ({
  open,
  onClose,
  roundType,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="round-info-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle
        id="round-info-title"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <InfoOutlinedIcon color="info" sx={{ mr: 1 }} />
        <Typography variant="h6" component="span" sx={{ flex: 1 }}>
          {getRoundTitle(roundType)}
        </Typography>
        <IconButton aria-label="Close info" onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
          {roundInfoContent[roundType]}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Returns a user-friendly title for each round type.
 */
function getRoundTitle(
  type:
    | "mixed"
    | "single-answer"
    | "multiple-choice"
    | "picture"
    | "audio"
    | "video"
    | "golden-pyramid"
): string {
  switch (type) {
    case "mixed":
      return "Mixed Types Round";
    case "single-answer":
      return "Single Answer Only Round";
    case "multiple-choice":
      return "Multiple Choice Round";
    case "picture":
      return "Picture Round";
    case "audio":
      return "Audio Round";
    case "video":
      return "Video Round";
    case "golden-pyramid":
      return "Golden Pyramid Round";
    default:
      return "Round Info";
  }
}
