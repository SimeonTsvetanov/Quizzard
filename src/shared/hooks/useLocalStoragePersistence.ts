/**
 * useLocalStoragePersistence Hook
 * 
 * Standard hook for managing localStorage state with automatic persistence.
 * Provides debounced auto-save functionality, error handling, and iOS safety checks.
 * 
 * This hook is the foundation for all data persistence in Quizzard following
 * the development standards for consistent localStorage management across features.
 * 
 * Features:
 * - Automatic debounced saving (default 500ms)
 * - iOS localStorage quota handling
 * - Error boundary with graceful degradation
 * - Type-safe operations with generics
 * - Validation for data integrity
 * 
 * @fileoverview Standardized localStorage persistence hook
 * @version 1.0.0
 * @since December 2025
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Configuration options for the localStorage persistence hook
 */
interface UseLocalStoragePersistenceOptions {
  /** Debounce delay in milliseconds for auto-save operations */
  debounceMs?: number;
  /** Whether to validate data before saving */
  validate?: boolean;
  /** Custom validation function for the stored data */
  validator?: (value: any) => boolean;
  /** Whether to enable iOS-specific safety checks */
  iosCompatMode?: boolean;
}

/**
 * Return type for the useLocalStoragePersistence hook
 */
interface UseLocalStoragePersistenceReturn<T> {
  /** Current value of the stored data */
  value: T;
  /** Function to update the stored value */
  setValue: (newValue: T | ((prevValue: T) => T)) => void;
  /** Whether the data is currently being saved */
  isSaving: boolean;
  /** Last error that occurred during save operation */
  lastError: Error | null;
  /** Function to manually trigger a save operation */
  forceSave: () => void;
  /** Function to clear the stored data */
  clearValue: () => void;
}

/**
 * Custom debounce implementation for localStorage operations
 * Prevents excessive writes during rapid state changes
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
};

/**
 * Validates if data can be safely JSON stringified and parsed
 * Prevents circular references and invalid data from being stored
 * 
 * @param value - Value to validate
 * @returns boolean indicating if value is safe to store
 */
const isValidForStorage = (value: any): boolean => {
  try {
    JSON.stringify(value);
    return true;
  } catch (error) {
    console.warn('Invalid data for localStorage storage:', error);
    return false;
  }
};

/**
 * Custom hook for localStorage persistence with auto-save
 * 
 * Manages state synchronization with localStorage, providing automatic
 * persistence with debouncing, error handling, and iOS compatibility.
 * 
 * @template T - Type of data being stored
 * @param key - localStorage key to use for storage
 * @param defaultValue - Default value if no stored data exists
 * @param options - Configuration options for the hook
 * @returns Object containing value, setter, and utility functions
 * 
 * @example
 * ```typescript
 * const [participants, setParticipants] = useLocalStoragePersistence(
 *   STORAGE_KEYS.RTG_PARTICIPANTS,
 *   [],
 *   { debounceMs: 500, iosCompatMode: true }
 * );
 * ```
 */
export const useLocalStoragePersistence = <T>(
  key: string,
  defaultValue: T,
  options: UseLocalStoragePersistenceOptions = {}
): UseLocalStoragePersistenceReturn<T> => {
  const {
    debounceMs = 500,
    validate = true,
    validator,
    iosCompatMode = true
  } = options;

  // State management
  const [value, setValueState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Run custom validation if provided
        if (validator && !validator(parsed)) {
          console.warn(`Stored data for key "${key}" failed validation, using default`);
          return defaultValue;
        }
        
        return parsed;
      }
    } catch (error) {
      console.warn(`Error loading data for key "${key}":`, error);
    }
    
    return defaultValue;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  /**
   * Saves data to localStorage with error handling and iOS compatibility
   * 
   * @param dataToSave - Data to save to localStorage
   */
  const saveToStorage = useCallback((dataToSave: T): void => {
    if (!key) {
      console.warn('No storage key provided, skipping save');
      return;
    }

    setIsSaving(true);
    setLastError(null);

    try {
      // Validate data before saving if enabled
      if (validate && !isValidForStorage(dataToSave)) {
        throw new Error('Data is not valid for storage');
      }

      // Run custom validation if provided
      if (validator && !validator(dataToSave)) {
        throw new Error('Data failed custom validation');
      }

      const serialized = JSON.stringify(dataToSave);
      localStorage.setItem(key, serialized);

      // iOS safety check - verify data was actually saved
      if (iosCompatMode) {
        const verification = localStorage.getItem(key);
        if (!verification || verification !== serialized) {
          throw new Error('iOS storage quota exceeded or blocked');
        }
      }

      console.debug(`Successfully saved data to localStorage key: ${key}`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error : new Error('Unknown storage error');
      setLastError(errorMsg);
      
      // iOS-specific error messaging
      if (iosCompatMode && errorMsg.message.includes('quota')) {
        console.warn(
          'Unable to save data. iPhone/iPad storage may be full.',
          'Consider clearing app data or freeing device storage.'
        );
      } else {
        console.warn(`localStorage save failed for key "${key}":`, errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [key, validate, validator, iosCompatMode]);

  /**
   * Debounced save function to prevent excessive localStorage writes
   * Only saves after user stops making changes for the specified delay
   */
  const debouncedSave = useMemo(
    () => debounce(saveToStorage, debounceMs),
    [saveToStorage, debounceMs]
  );

  /**
   * Updates the value and triggers auto-save
   * Supports both direct values and updater functions
   * 
   * @param newValue - New value or function to update the value
   */
  const setValue = useCallback((newValue: T | ((prevValue: T) => T)): void => {
    setValueState(prevValue => {
      const updatedValue = typeof newValue === 'function' 
        ? (newValue as (prevValue: T) => T)(prevValue)
        : newValue;
      
      // Trigger debounced save with new value
      debouncedSave(updatedValue);
      
      return updatedValue;
    });
  }, [debouncedSave]);

  /**
   * Forces an immediate save without debouncing
   * Useful for critical operations or manual save triggers
   */
  const forceSave = useCallback((): void => {
    saveToStorage(value);
  }, [saveToStorage, value]);

  /**
   * Clears the stored value and removes it from localStorage
   * Resets to the default value
   */
  const clearValue = useCallback((): void => {
    try {
      localStorage.removeItem(key);
      setValueState(defaultValue);
      setLastError(null);
      console.debug(`Cleared localStorage key: ${key}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error : new Error('Failed to clear storage');
      setLastError(errorMsg);
      console.warn(`Failed to clear localStorage key "${key}":`, errorMsg);
    }
  }, [key, defaultValue]);

  /**
   * Auto-save effect
   * Saves the current value whenever it changes (with debouncing)
   */
  useEffect(() => {
    debouncedSave(value);
  }, [value, debouncedSave]);

  return {
    value,
    setValue,
    isSaving,
    lastError,
    forceSave,
    clearValue
  };
}; 