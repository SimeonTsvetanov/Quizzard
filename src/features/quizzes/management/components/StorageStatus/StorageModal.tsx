/**
 * Storage Modal Component
 *
 * Beautiful modal dialog for displaying storage usage, quiz list with sizes,
 * and storage management actions. Provides a clean interface for users to
 * monitor and manage their quiz storage.
 *
 * Features:
 * - Storage usage visualization with animated progress
 * - Detailed quiz list with individual storage sizes
 * - Storage cleanup functionality with confirmation
 * - Beautiful Material-UI design with animations
 * - Responsive layout for mobile and desktop
 *
 * @fileoverview Storage management modal component
 * @version 1.0.0
 * @since December 2025
 */

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Alert,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Close as CloseIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Quiz as QuizIcon,
  Edit as DraftIcon,
  BarChart as ChartIcon,
  CleaningServices as CleanIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import type { Quiz } from "../../types";
import type { StorageUsage } from "../../services/indexedDBService";

/**
 * Props for the StorageModal component
 */
interface StorageModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Storage usage information */
  storageUsage: StorageUsage | null;
  /** Array of all quizzes (including drafts) */
  quizzes: Quiz[];
  /** Number of drafts */
  draftsCount: number;
  /** Callback to cleanup storage */
  onCleanupStorage: () => void;
  /** Callback to refresh storage info */
  onRefreshStorage: () => void;
}

/**
 * Storage Modal Component
 *
 * Renders a beautiful modal with storage information, quiz list, and management actions.
 */
export const StorageModal: React.FC<StorageModalProps> = ({
  open,
  onClose,
  storageUsage,
  quizzes,
  draftsCount,
  onCleanupStorage,
  onRefreshStorage,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Format file size helper
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Calculate individual quiz sizes (estimated)
  const quizzesWithSizes = useMemo(() => {
    return quizzes.map((quiz) => {
      // Estimate size based on content
      const baseSize = 1024; // 1KB base
      const questionSize = (quiz.rounds?.length || 0) * 512; // 512B per round
      const titleSize = (quiz.title?.length || 0) * 2; // 2B per character
      const descSize = (quiz.description?.length || 0) * 2;
      const estimatedSize = baseSize + questionSize + titleSize + descSize;

      return {
        ...quiz,
        estimatedSize,
      };
    });
  }, [quizzes]);

  // Handle cleanup confirmation
  const handleCleanupClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmCleanup = () => {
    onCleanupStorage();
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleCancelCleanup = () => {
    setShowDeleteConfirm(false);
  };

  // Storage usage percentage
  const usagePercentage = storageUsage?.percentageUsed || 0;
  const isNearLimit = storageUsage?.isNearLimit || false;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={Zoom}
        transitionDuration={300}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? "100%" : "90vh",
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: "white",
            textAlign: "center",
            position: "relative",
            py: 3,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <StorageIcon sx={{ fontSize: 28 }} />
            <Typography variant="h5" component="div" fontWeight="bold">
              Storage
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "white",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Content */}
        <DialogContent sx={{ p: 0 }}>
          {/* Storage Usage Section */}
          <Box sx={{ p: 3, bgcolor: "background.default" }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <ChartIcon color="primary" />
              <Typography variant="h6" fontWeight="600">
                Current Usage
              </Typography>
            </Box>

            {storageUsage && (
              <Fade in timeout={500}>
                <Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {formatSize(storageUsage.totalSize)} / 500 MB
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color={isNearLimit ? "warning.main" : "text.primary"}
                    >
                      {usagePercentage.toFixed(1)}% used
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(usagePercentage, 100)}
                    color={isNearLimit ? "warning" : "primary"}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: "rgba(0,0,0,0.1)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 6,
                        background: isNearLimit
                          ? `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`
                          : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      },
                    }}
                  />

                  {isNearLimit && (
                    <Alert
                      severity="warning"
                      icon={<WarningIcon />}
                      sx={{ mt: 2, borderRadius: 2 }}
                    >
                      Storage is nearly full. Consider cleaning up old quizzes.
                    </Alert>
                  )}
                </Box>
              </Fade>
            )}
          </Box>

          <Divider />

          {/* Quiz List Section */}
          <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <QuizIcon color="primary" />
              <Typography variant="h6" fontWeight="600">
                Quiz Storage
              </Typography>
              <Chip
                label={`${quizzesWithSizes.length} items`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>

            {quizzesWithSizes.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  No quizzes found
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 300, overflow: "auto" }}>
                {quizzesWithSizes.map((quiz, index) => (
                  <Fade in timeout={300 + index * 100} key={quiz.id}>
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <ListItemIcon>
                        {quiz.isDraft ? (
                          <DraftIcon color="secondary" />
                        ) : (
                          <QuizIcon color="primary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" noWrap>
                              {quiz.title}
                            </Typography>
                            {quiz.isDraft && (
                              <Chip
                                label="Draft"
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {quiz.rounds?.length || 0} rounds • Created{" "}
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </Typography>
                        }
                      />
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="primary.main"
                      >
                        {formatSize(quiz.estimatedSize)}
                      </Typography>
                    </ListItem>
                  </Fade>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions
          sx={{
            p: 3,
            bgcolor: "background.default",
            borderTop: 1,
            borderColor: "divider",
            gap: 2,
          }}
        >
          <Button
            onClick={handleCleanupClick}
            startIcon={<CleanIcon />}
            color="error"
            variant="outlined"
            disabled={quizzesWithSizes.length === 0}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Clear All Storage
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={handleCancelCleanup}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 3 }}>
          <WarningIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
          <Typography variant="h6" fontWeight="600">
            Clear All Storage
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center", pb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to clear all quiz storage? This will
            permanently delete <strong>ALL quizzes and drafts</strong> from your
            device.
          </Typography>
          <Typography
            variant="body2"
            color="error.main"
            sx={{ mt: 2, fontWeight: 600 }}
          >
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={handleCancelCleanup}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            autoFocus
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmCleanup}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Clear All Storage
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
