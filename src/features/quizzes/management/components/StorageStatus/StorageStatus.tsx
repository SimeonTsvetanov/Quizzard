/**
 * Storage Status Component
 *
 * Displays storage usage information, auto-save status, and provides
 * storage management actions for the quiz system.
 *
 * Features:
 * - Auto-save status indicator
 * - Storage usage visualization
 * - Storage cleanup actions
 * - Warning notifications for storage limits
 *
 * @fileoverview Storage status and management component
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import {
  Box,
  Chip,
  LinearProgress,
  Typography,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  Save as SaveIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
  Storage as StorageIcon,
  CleaningServices as CleanIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type { AutoSaveStatus } from "../../hooks/useQuizStorage";
import type { StorageUsage } from "../../services/indexedDBService";

/**
 * Props for the StorageStatus component
 */
interface StorageStatusProps {
  /** Current auto-save status */
  autoSaveStatus: AutoSaveStatus;
  /** Storage usage information */
  storageUsage: StorageUsage | null;
  /** Whether storage warning is dismissed */
  storageWarningDismissed: boolean;
  /** Whether IndexedDB is initialized */
  isInitialized: boolean;
  /** Number of drafts available */
  draftsCount: number;
  /** Callback to dismiss storage warning */
  onDismissStorageWarning: () => void;
  /** Callback to cleanup old drafts */
  onCleanupDrafts: () => void;
  /** Callback to refresh storage info */
  onRefreshStorage: () => void;
}

/**
 * Auto-save status indicator
 */
const AutoSaveIndicator: React.FC<{ status: AutoSaveStatus }> = ({
  status,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "saving":
        return {
          icon: (
            <SyncIcon
              sx={{ fontSize: 16, animation: "spin 1s linear infinite" }}
            />
          ),
          label: "Saving...",
          color: "info" as const,
        };
      case "saved":
        return {
          icon: <CheckIcon sx={{ fontSize: 16 }} />,
          label: "Saved",
          color: "success" as const,
        };
      case "error":
        return {
          icon: <ErrorIcon sx={{ fontSize: 16 }} />,
          label: "Save Failed",
          color: "error" as const,
        };
      default:
        return {
          icon: <SaveIcon sx={{ fontSize: 16 }} />,
          label: "Auto-save",
          color: "default" as const,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      sx={{
        "& .MuiChip-icon": {
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
        },
      }}
    />
  );
};

/**
 * Storage usage display
 */
const StorageUsageDisplay: React.FC<{
  usage: StorageUsage;
  onRefresh: () => void;
}> = ({ usage, onRefresh }) => {
  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <Box sx={{ minWidth: 200 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <StorageIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary">
          Storage Usage
        </Typography>
        <Tooltip title="Refresh storage info">
          <IconButton size="small" onClick={onRefresh}>
            <SyncIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={Math.min(usage.percentageUsed, 100)}
        color={usage.isNearLimit ? "warning" : "primary"}
        sx={{ mb: 1, height: 6, borderRadius: 3 }}
      />

      <Typography variant="caption" color="text.secondary">
        {formatSize(usage.totalSize)} /{" "}
        {formatSize(usage.totalSize + usage.remainingSpace)}(
        {usage.percentageUsed.toFixed(1)}% used)
      </Typography>
    </Box>
  );
};

/**
 * Storage Status Component
 */
export const StorageStatus: React.FC<StorageStatusProps> = ({
  autoSaveStatus,
  storageUsage,
  storageWarningDismissed,
  isInitialized,
  draftsCount,
  onDismissStorageWarning,
  onCleanupDrafts,
  onRefreshStorage,
}) => {
  // Don't show anything if storage isn't initialized
  if (!isInitialized) {
    return null;
  }

  const showStorageWarning =
    storageUsage?.isNearLimit && !storageWarningDismissed;

  return (
    <Box sx={{ mb: 2 }}>
      {/* Storage warning alert */}
      {showStorageWarning && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <IconButton
              size="small"
              onClick={onDismissStorageWarning}
              aria-label="Dismiss storage warning"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          Storage is {storageUsage!.percentageUsed.toFixed(1)}% full. Consider
          deleting old quizzes or cleaning up drafts.
        </Alert>
      )}

      {/* Status bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
        }}
      >
        {/* Left side - Auto-save status */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <AutoSaveIndicator status={autoSaveStatus} />

          {draftsCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {draftsCount} draft{draftsCount !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>

        {/* Center - Storage usage */}
        {storageUsage && (
          <StorageUsageDisplay
            usage={storageUsage}
            onRefresh={onRefreshStorage}
          />
        )}

        {/* Right side - Actions */}
        <Box sx={{ display: "flex", gap: 1 }}>
          {draftsCount > 0 && (
            <Tooltip title="Clean up old drafts (30+ days)">
              <Button
                size="small"
                startIcon={<CleanIcon />}
                onClick={onCleanupDrafts}
                variant="outlined"
              >
                Cleanup
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
};
