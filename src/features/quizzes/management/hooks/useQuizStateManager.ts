/**
 * Enhanced Quiz State Manager Hook
 *
 * Provides robust state synchronization with debugging and error recovery
 * for quiz management operations.
 *
 * @fileoverview Enhanced state manager for quiz operations
 * @version 1.0.0
 * @since December 2025
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuizStorage } from "./useQuizStorage";
import type { Quiz } from "../types";

// Debug mode for development
const DEBUG_SYNC = process.env.NODE_ENV === "development";

/**
 * Enhanced debug logging for state synchronization
 */
const debugLog = (operation: string, data: any) => {
  if (DEBUG_SYNC) {
    console.log(`🔄 [QuizStateManager] ${operation}:`, data);
  }
};

/**
 * State synchronization status
 */
export type SyncStatus = "idle" | "syncing" | "synced" | "error";

/**
 * Enhanced state manager interface
 */
export interface UseQuizStateManagerReturn {
  // State data
  quizzes: Quiz[];
  drafts: Partial<Quiz>[];
  isLoading: boolean;
  syncStatus: SyncStatus;

  // Operations with enhanced synchronization
  deleteQuizWithSync: (id: string) => Promise<boolean>;
  saveQuizWithSync: (quiz: Quiz) => Promise<boolean>;
  forceRefreshAll: () => Promise<void>;

  // Debug utilities
  getDebugInfo: () => object;
}

/**
 * Enhanced Quiz State Manager Hook
 */
export const useQuizStateManager = (): UseQuizStateManagerReturn => {
  const {
    quizzes,
    drafts,
    isLoading,
    deleteQuiz,
    saveQuiz,
    loadQuizzes,
    loadDrafts,
    refreshStorageUsage,
  } = useQuizStorage();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const lastSyncRef = useRef<number>(0);

  /**
   * Force refresh all data with comprehensive synchronization
   */
  const forceRefreshAll = useCallback(async (): Promise<void> => {
    try {
      setSyncStatus("syncing");
      debugLog("Force refresh all data", { timestamp: Date.now() });

      await Promise.all([loadQuizzes(), loadDrafts(), refreshStorageUsage()]);

      lastSyncRef.current = Date.now();
      setSyncStatus("synced");

      // Reset to idle after 2 seconds
      setTimeout(() => setSyncStatus("idle"), 2000);

      debugLog("Force refresh completed", {
        quizzesCount: quizzes.length,
        draftsCount: drafts.length,
        timestamp: lastSyncRef.current,
      });
    } catch (error) {
      debugLog("Force refresh failed", error);
      setSyncStatus("error");

      // Reset to idle after 5 seconds
      setTimeout(() => setSyncStatus("idle"), 5000);
      throw error;
    }
  }, [
    loadQuizzes,
    loadDrafts,
    refreshStorageUsage,
    quizzes.length,
    drafts.length,
  ]);

  /**
   * Enhanced delete with comprehensive synchronization
   */
  const deleteQuizWithSync = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setSyncStatus("syncing");
        debugLog("Delete quiz with sync", { id, quizCount: quizzes.length });

        const success = await deleteQuiz(id);

        if (success) {
          // Force complete data refresh
          await forceRefreshAll();
          debugLog("Delete and refresh completed", {
            id,
            newQuizCount: quizzes.length,
          });
          return true;
        }

        setSyncStatus("error");
        return false;
      } catch (error) {
        debugLog("Delete with sync failed", { id, error });
        setSyncStatus("error");
        return false;
      }
    },
    [deleteQuiz, forceRefreshAll, quizzes.length]
  );

  /**
   * Enhanced save with comprehensive synchronization
   */
  const saveQuizWithSync = useCallback(
    async (quiz: Quiz): Promise<boolean> => {
      try {
        setSyncStatus("syncing");
        debugLog("Save quiz with sync", { id: quiz.id, title: quiz.title });

        const success = await saveQuiz(quiz);

        if (success) {
          // Force complete data refresh
          await forceRefreshAll();
          debugLog("Save and refresh completed", {
            id: quiz.id,
            title: quiz.title,
          });
          return true;
        }

        setSyncStatus("error");
        return false;
      } catch (error) {
        debugLog("Save with sync failed", { id: quiz.id, error });
        setSyncStatus("error");
        return false;
      }
    },
    [saveQuiz, forceRefreshAll]
  );

  /**
   * Get comprehensive debug information
   */
  const getDebugInfo = useCallback(() => {
    return {
      quizzesCount: quizzes.length,
      draftsCount: drafts.length,
      isLoading,
      syncStatus,
      lastSync: lastSyncRef.current,
      lastSyncAge: Date.now() - lastSyncRef.current,
      quizIds: quizzes.map((q) => q.id),
      draftIds: drafts.map((d) => d.id),
    };
  }, [quizzes, drafts, isLoading, syncStatus]);

  // Auto-refresh on component mount
  useEffect(() => {
    forceRefreshAll();
  }, []);

  return {
    quizzes,
    drafts,
    isLoading,
    syncStatus,
    deleteQuizWithSync,
    saveQuizWithSync,
    forceRefreshAll,
    getDebugInfo,
  };
};
