/**
 * Centralized Storage Keys for Quizzard Application
 * 
 * This file contains all localStorage keys used throughout the application.
 * Following the development standards for consistent data persistence across
 * all features and tools.
 * 
 * Key Naming Convention:
 * - Global app settings: 'user-settings-{setting-name}'
 * - Feature-specific: '{feature-prefix}-{data-type}'
 * - Feature prefixes: rtg (Random Team Generator), pc (Points Counter), qb (Quiz Builder)
 * 
 * @fileoverview Central storage key management for localStorage operations
 * @version 1.0.0
 * @since December 2025
 */

/**
 * All localStorage keys used across the Quizzard application
 * Organized by feature for easy maintenance and consistency
 */
export const STORAGE_KEYS = {
  // Global Application Settings
  /** User's selected theme preference (light/dark/system) */
  THEME: 'user-settings-theme-selection',
  /** Whether user has dismissed the PWA install prompt */
  PWA_INSTALL_PROMPT: 'user-settings-pwa-install-dismissed',
  
  // Random Team Generator Feature
  /** Participant names and input state for team generation */
  RTG_PARTICIPANTS: 'rtg-participants',
  /** Selected number of teams for generation */
  RTG_TEAM_COUNT: 'rtg-team-count',
  /** Last generated teams data for reference */
  RTG_LAST_TEAMS: 'rtg-last-teams',
  
  // Points Counter Feature (Future Implementation)
  /** Current active game state with all rounds and scores */
  PC_GAME_STATE: 'pc-current-game-state',
  /** Team names and configurations */
  PC_TEAMS: 'pc-teams-data',
  /** Round-by-round scoring data */
  PC_ROUNDS: 'pc-rounds-data',
  /** Game settings and preferences */
  PC_SETTINGS: 'pc-game-settings',
  
  // Quiz Builder Feature (Future Implementation)
  /** Saved quiz templates and questions */
  QB_QUIZZES: 'qb-saved-quizzes',
  /** Quiz templates for quick creation */
  QB_TEMPLATES: 'qb-quiz-templates',
  /** Builder settings and preferences */
  QB_SETTINGS: 'qb-builder-settings'
} as const;

/**
 * Type definition for storage keys to ensure type safety
 * when referencing keys throughout the application
 */
export type StorageKeyType = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Legacy key mappings for backwards compatibility
 * Maps old hardcoded keys to new centralized keys
 * 
 * @deprecated These mappings exist for migration purposes only
 * New code should use STORAGE_KEYS directly
 */
export const LEGACY_KEY_MAPPINGS = {
  /** Legacy Random Team Generator participants key */
  'quizzard-random-team-generator-participants': STORAGE_KEYS.RTG_PARTICIPANTS,
} as const;

/**
 * Utility function to migrate from legacy storage keys to new standardized keys
 * Safely transfers data from old keys to new keys without data loss
 * 
 * @param legacyKey - The old storage key to migrate from
 * @param newKey - The new standardized storage key to migrate to
 * @returns boolean indicating if migration was successful
 */
export const migrateLegacyStorageKey = (legacyKey: string, newKey: string): boolean => {
  try {
    const legacyData = localStorage.getItem(legacyKey);
    if (legacyData) {
      // Copy data to new key
      localStorage.setItem(newKey, legacyData);
      // Remove old key to prevent confusion
      localStorage.removeItem(legacyKey);
      console.log(`Migrated localStorage from ${legacyKey} to ${newKey}`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`Failed to migrate storage key ${legacyKey} to ${newKey}:`, error);
    return false;
  }
};

/**
 * Performs automatic migration of all known legacy keys to new standardized keys
 * Should be called once during app initialization to ensure data continuity
 * 
 * @returns number of keys successfully migrated
 */
export const performLegacyStorageMigration = (): number => {
  let migratedCount = 0;
  
  Object.entries(LEGACY_KEY_MAPPINGS).forEach(([legacyKey, newKey]) => {
    if (migrateLegacyStorageKey(legacyKey, newKey)) {
      migratedCount++;
    }
  });
  
  if (migratedCount > 0) {
    console.log(`Successfully migrated ${migratedCount} legacy storage keys to new format`);
  }
  
  return migratedCount;
}; 