/**
 * Shared Type Definitions for Quizzard Application
 * 
 * This file contains global type definitions used across multiple features
 * and components in the Quizzard application. These types ensure consistency
 * and type safety throughout the application.
 * 
 * Organization:
 * - UI/Component types
 * - Theme and styling types
 * - Navigation and routing types
 * - Data persistence types
 * - Utility and helper types
 * 
 * @fileoverview Global type definitions for cross-feature consistency
 * @version 1.0.0
 * @since December 2025
 */

/**
 * Theme mode options available in the application
 * Supports light, dark, and system preference following
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme selection type for user preference settings
 * Used in theme management and user settings persistence
 */
export type ThemeSelection = 'light' | 'dark' | 'system';

/**
 * Snackbar severity levels for user feedback messages
 * Follows Material-UI Alert severity conventions
 */
export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

/**
 * Snackbar state interface for consistent messaging across the app
 * Used by useSnackbar hook and Snackbar components
 */
export interface SnackbarState {
  /** Whether the snackbar is currently visible */
  open: boolean;
  /** The message to display to the user */
  message: string;
  /** The severity/type of the message */
  severity: SnackbarSeverity;
}

/**
 * Loading state interface for async operations
 * Provides consistent loading state management across features
 */
export interface LoadingState {
  /** Whether an operation is currently in progress */
  isLoading: boolean;
  /** Optional loading message to display */
  message?: string;
  /** Progress percentage (0-100) for progress indicators */
  progress?: number;
}

/**
 * Error state interface for error handling and display
 * Standardizes error information across the application
 */
export interface ErrorState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error message to display */
  message?: string;
  /** The underlying error object */
  error?: Error;
  /** Optional error code for specific error types */
  code?: string | number;
}

/**
 * Base component props that are common across many components
 * Provides standard props for styling and behavior
 */
export interface BaseComponentProps {
  /** Optional CSS class name */
  className?: string;
  /** Optional test ID for testing purposes */
  testId?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Optional loading state */
  loading?: boolean;
}

/**
 * Modal/Dialog state interface for consistent modal management
 * Used across various modal and dialog components
 */
export interface ModalState {
  /** Whether the modal is currently open */
  open: boolean;
  /** Optional title for the modal */
  title?: string;
  /** Optional data associated with the modal */
  data?: any;
}

/**
 * Navigation item interface for menu and navigation components
 * Standardizes navigation structure across the app
 */
export interface NavigationItem {
  /** Unique identifier for the navigation item */
  id: string;
  /** Display label for the navigation item */
  label: string;
  /** Route path or URL for navigation */
  path: string;
  /** Optional icon name or component */
  icon?: string;
  /** Whether this navigation item is currently active */
  active?: boolean;
  /** Whether this navigation item is disabled */
  disabled?: boolean;
  /** Optional badge count for notifications */
  badge?: number;
}

/**
 * Feature card interface for tool/feature display
 * Used in home page and feature listing components
 */
export interface FeatureCard {
  /** Unique identifier for the feature */
  id: string;
  /** Display title of the feature */
  title: string;
  /** Brief description of what the feature does */
  description: string;
  /** Route path to navigate to the feature */
  path: string;
  /** Icon name or component for the feature */
  icon: string;
  /** Whether the feature is currently available */
  available: boolean;
  /** Optional status (e.g., "Beta", "Coming Soon") */
  status?: string;
  /** Optional color theme for the card */
  color?: string;
}

/**
 * API response interface for consistent API communication
 * Standardizes response format from any future API endpoints
 */
export interface ApiResponse<T = any> {
  /** Whether the operation was successful */
  success: boolean;
  /** The response data */
  data?: T;
  /** Error message if operation failed */
  message?: string;
  /** Optional error code */
  code?: string | number;
  /** Additional metadata */
  meta?: {
    /** Total count for paginated responses */
    total?: number;
    /** Current page for paginated responses */
    page?: number;
    /** Items per page for paginated responses */
    limit?: number;
  };
}

/**
 * Pagination interface for data lists
 * Standardizes pagination across different data views
 */
export interface PaginationState {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Whether there are more pages available */
  hasNextPage: boolean;
  /** Whether there are previous pages available */
  hasPrevPage: boolean;
}

/**
 * Sort configuration interface for data sorting
 * Standardizes sorting functionality across data views
 */
export interface SortConfig {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Filter configuration interface for data filtering
 * Standardizes filtering functionality across data views
 */
export interface FilterConfig {
  /** Field to filter by */
  field: string;
  /** Filter operator (equals, contains, greater than, etc.) */
  operator: 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  /** Value to filter by */
  value: any;
}

/**
 * Device breakpoint type for responsive design
 * Matches Material-UI breakpoint system
 */
export type DeviceBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * PWA installation state for Progressive Web App functionality
 * Tracks PWA installation prompts and status
 */
export interface PWAInstallState {
  /** Whether PWA installation is supported */
  isSupported: boolean;
  /** Whether the install prompt is available */
  canInstall: boolean;
  /** Whether the app is currently installed */
  isInstalled: boolean;
  /** Whether the user has dismissed the install prompt */
  isDismissed: boolean;
}

/**
 * Utility type for making all properties of a type optional
 * except for the specified required properties
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Utility type for making specific properties required
 * while keeping others optional
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for creating a type with only the specified properties
 * from the original type
 */
export type PickFields<T, K extends keyof T> = Pick<T, K>;

/**
 * Utility type for creating a type without the specified properties
 * from the original type
 */
export type OmitFields<T, K extends keyof T> = Omit<T, K>; 