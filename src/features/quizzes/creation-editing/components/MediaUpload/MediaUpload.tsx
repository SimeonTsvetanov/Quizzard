/**
 * Media Upload Component
 *
 * Handles file uploads for quiz questions including pictures, audio, and video files.
 * Provides file validation, size checking, and preview functionality.
 * Converts files to base64 for IndexedDB storage.
 *
 * Features:
 * - Drag and drop file upload
 * - File type validation (images, audio, video)
 * - File size limits (10MB images, 20MB audio, 100MB video)
 * - Preview for uploaded files
 * - Thumbnail generation for videos/images
 * - Error handling and user feedback
 *
 * @fileoverview Media upload component for quiz questions
 * @version 1.0.0
 * @since December 2025
 */

import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  FilePresent as FileIcon,
} from "@mui/icons-material";
import type { MediaUploadProps, MediaFile } from "../../types";
import { FILE_SIZE_LIMITS, SUPPORTED_MEDIA_TYPES } from "../../types";

/**
 * Media Upload Component
 */
export const MediaUpload: React.FC<MediaUploadProps> = ({
  acceptedTypes,
  maxFileSize,
  onFileUpload,
  onUploadError,
  currentFile,
  fileType,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Get file type icon
   */
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon />;
    if (type.startsWith("audio/")) return <AudioIcon />;
    if (type.startsWith("video/")) return <VideoIcon />;
    return <FileIcon />;
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /**
   * Validate file type and size
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const isValidType = acceptedTypes.some(
      (type) => file.type === type || fileExtension === type.replace(".", "")
    );

    if (!isValidType) {
      return `Invalid file type. Accepted types: ${acceptedTypes.join(", ")}`;
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `File too large. Maximum size: ${formatFileSize(maxFileSize)}`;
    }

    return null;
  };

  /**
   * Generate thumbnail for images and videos
   */
  const generateThumbnail = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const maxSize = 200;

            let { width, height } = img;
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    }

    if (file.type.startsWith("video/")) {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        video.onloadedmetadata = () => {
          video.currentTime = 1; // Seek to 1 second for thumbnail
        };
        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const maxSize = 200;

          let { videoWidth: width, videoHeight: height } = video;
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(video, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };

        const reader = new FileReader();
        reader.onload = (e) => {
          video.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    }

    return undefined;
  };

  /**
   * Get audio/video duration
   */
  const getMediaDuration = async (file: File): Promise<number | undefined> => {
    if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
      return new Promise((resolve) => {
        const media = file.type.startsWith("audio/")
          ? new Audio()
          : document.createElement("video");

        media.onloadedmetadata = () => {
          resolve(media.duration);
        };

        media.onerror = () => {
          resolve(undefined);
        };

        const reader = new FileReader();
        reader.onload = (e) => {
          media.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    }
    return undefined;
  };

  /**
   * Process uploaded file
   */
  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        onUploadError(validationError);
        return;
      }

      setUploadProgress(20);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          setUploadProgress(50);

          // Generate thumbnail if applicable
          const thumbnail = await generateThumbnail(file);
          setUploadProgress(70);

          // Get duration for media files
          const duration = await getMediaDuration(file);
          setUploadProgress(90);

          // Create MediaFile object
          const mediaFile: MediaFile = {
            id: `media_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            filename: file.name,
            type: fileType,
            size: file.size,
            data: e.target?.result as string,
            mimeType: file.type,
            thumbnail,
            duration,
            createdAt: new Date(),
          };

          setUploadProgress(100);
          onFileUpload(mediaFile);
        } catch (error) {
          console.error("Error processing file:", error);
          onUploadError("Failed to process file. Please try again.");
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        onUploadError("Failed to read file. Please try again.");
        setIsUploading(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      onUploadError("Failed to process file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    processFile(file);
  }, []);

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  /**
   * Handle click to select file
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  /**
   * Remove current file
   */
  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Call with empty data to remove
    onFileUpload({
      id: "",
      filename: "",
      type: fileType,
      size: 0,
      data: "",
      mimeType: "",
      createdAt: new Date(),
    });
  };

  /**
   * Get accepted file types string for display
   */
  const getAcceptedTypesDisplay = () => {
    const types =
      SUPPORTED_MEDIA_TYPES[
        `${fileType}s` as keyof typeof SUPPORTED_MEDIA_TYPES
      ];
    return types.map((type) => `.${type}`).join(", ");
  };

  return (
    <Box sx={{ width: "100%" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        aria-label={`Upload ${fileType} file`}
      />

      {currentFile && currentFile.id ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {getFileIcon(currentFile.mimeType)}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" noWrap>
                  {currentFile.filename}
                </Typography>
                <Box
                  sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}
                >
                  <Chip
                    label={formatFileSize(currentFile.size)}
                    size="small"
                    variant="outlined"
                  />
                  {currentFile.duration && (
                    <Chip
                      label={`${Math.round(currentFile.duration)}s`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
              {currentFile.thumbnail && (
                <Box
                  component="img"
                  src={currentFile.thumbnail}
                  alt="Thumbnail"
                  sx={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 1,
                  }}
                />
              )}
              <IconButton
                onClick={handleRemoveFile}
                color="error"
                size="small"
                aria-label="Remove file"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card
          sx={{
            border: 2,
            borderStyle: "dashed",
            borderColor: isDragging ? "primary.main" : "grey.300",
            bgcolor: isDragging ? "primary.light" : "background.paper",
            cursor: "pointer",
            transition: "all 0.3s ease",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "primary.light",
            },
          }}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <UploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Upload {fileType.charAt(0).toUpperCase() + fileType.slice(1)} File
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Drag and drop a file here, or click to select
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Accepted formats: {getAcceptedTypesDisplay()}
            </Typography>
            <Typography variant="caption" display="block">
              Maximum size: {formatFileSize(maxFileSize)}
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              sx={{ mt: 2 }}
              disabled={isUploading}
            >
              Choose File
            </Button>
          </CardContent>
        </Card>
      )}

      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Processing file...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}
    </Box>
  );
};
