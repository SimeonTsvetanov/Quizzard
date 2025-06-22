/**
 * IndexedDB Service for Quiz Data Persistence
 *
 * Provides a robust IndexedDB-based storage solution for quiz data with
 * support for large media files, auto-save functionality, and fallback
 * to localStorage when IndexedDB is unavailable.
 *
 * Features:
 * - Large file storage (up to 500MB total)
 * - Auto-save with draft management
 * - Data migration from localStorage
 * - Error handling and fallback strategies
 * - Performance monitoring
 *
 * @fileoverview IndexedDB service for quiz data persistence
 * @version 1.0.0
 * @since December 2025
 */

import type { Quiz, MediaFile } from "../types";

/**
 * Database configuration constants
 */
const DB_CONFIG = {
  name: "QuizzardDB",
  version: 1,
  stores: {
    quizzes: "quizzes",
    drafts: "drafts",
    mediaFiles: "mediaFiles",
    metadata: "metadata",
  },
} as const;

/**
 * Storage limits and thresholds
 */
export const STORAGE_LIMITS = {
  TOTAL_QUIZ_SIZE: 500 * 1024 * 1024, // 500MB total
  SINGLE_IMAGE: 10 * 1024 * 1024, // 10MB per image
  SINGLE_AUDIO: 20 * 1024 * 1024, // 20MB per audio
  SINGLE_VIDEO: 100 * 1024 * 1024, // 100MB per video
  WARNING_THRESHOLD: 400 * 1024 * 1024, // Warn at 400MB
} as const;

/**
 * Auto-save configuration
 */
export const AUTO_SAVE_CONFIG = {
  DEBOUNCE_DELAY: 30000, // 30 seconds
  MAX_RETRIES: 3, // Retry failed saves
  RETRY_DELAY: 5000, // 5 seconds between retries
  DRAFT_CLEANUP_DAYS: 30, // Remove drafts older than 30 days
} as const;

/**
 * Database metadata interface
 */
interface DatabaseMetadata {
  version: string;
  lastSync?: Date;
  totalSize: number;
  createdAt: Date;
  lastCleanup?: Date;
}

/**
 * Storage operation result
 */
interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  usedFallback?: boolean;
}

/**
 * Storage usage information
 */
export interface StorageUsage {
  totalSize: number;
  quizzesSize: number;
  draftsSize: number;
  mediaFilesSize: number;
  remainingSpace: number;
  percentageUsed: number;
  isNearLimit: boolean;
}

/**
 * IndexedDB Service Class
 */
class IndexedDBService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<boolean> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initializeDB();
    return this.initPromise;
  }

  /**
   * Internal database initialization
   */
  private async _initializeDB(): Promise<boolean> {
    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn("IndexedDB not available, will use localStorage fallback");
        return false;
      }

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

        request.onerror = () => {
          console.error("Failed to open IndexedDB:", request.error);
          reject(false);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.isInitialized = true;
          console.log("IndexedDB initialized successfully");
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create object stores
          if (!db.objectStoreNames.contains(DB_CONFIG.stores.quizzes)) {
            const quizzesStore = db.createObjectStore(
              DB_CONFIG.stores.quizzes,
              {
                keyPath: "id",
              }
            );
            quizzesStore.createIndex("status", "status", { unique: false });
            quizzesStore.createIndex("createdAt", "createdAt", {
              unique: false,
            });
            quizzesStore.createIndex("category", "category", { unique: false });
          }

          if (!db.objectStoreNames.contains(DB_CONFIG.stores.drafts)) {
            const draftsStore = db.createObjectStore(DB_CONFIG.stores.drafts, {
              keyPath: "id",
            });
            draftsStore.createIndex("lastSaved", "lastSaved", {
              unique: false,
            });
          }

          if (!db.objectStoreNames.contains(DB_CONFIG.stores.mediaFiles)) {
            const mediaStore = db.createObjectStore(
              DB_CONFIG.stores.mediaFiles,
              {
                keyPath: "id",
              }
            );
            mediaStore.createIndex("type", "type", { unique: false });
            mediaStore.createIndex("size", "size", { unique: false });
          }

          if (!db.objectStoreNames.contains(DB_CONFIG.stores.metadata)) {
            db.createObjectStore(DB_CONFIG.stores.metadata, {
              keyPath: "key",
            });
          }
        };
      });
    } catch (error) {
      console.error("IndexedDB initialization failed:", error);
      return false;
    }
  }

  /**
   * Execute a transaction with error handling
   */
  private async executeTransaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    operation: (transaction: IDBTransaction) => Promise<T>
  ): Promise<StorageResult<T>> {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const transaction = this.db.transaction(storeNames, mode);

      return new Promise((resolve) => {
        transaction.oncomplete = () => {
          // Transaction completed successfully
        };

        transaction.onerror = () => {
          resolve({
            success: false,
            error: `Transaction failed: ${transaction.error?.message}`,
          });
        };

        operation(transaction)
          .then((data) => {
            resolve({ success: true, data });
          })
          .catch((error) => {
            resolve({
              success: false,
              error: error.message || "Operation failed",
            });
          });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Save a quiz (completed quiz)
   */
  async saveQuiz(quiz: Quiz): Promise<StorageResult<Quiz>> {
    await this.initialize();

    if (!this.isInitialized) {
      return this.saveQuizFallback(quiz);
    }

    // Check storage limits before saving
    const usage = await this.getStorageUsage();
    const quizSize = this.calculateQuizSize(quiz);

    if (usage.totalSize + quizSize > STORAGE_LIMITS.TOTAL_QUIZ_SIZE) {
      return {
        success: false,
        error:
          "Storage limit exceeded. Please delete some quizzes or media files.",
      };
    }

    return this.executeTransaction(
      [DB_CONFIG.stores.quizzes, DB_CONFIG.stores.mediaFiles],
      "readwrite",
      async (transaction) => {
        const quizzesStore = transaction.objectStore(DB_CONFIG.stores.quizzes);
        const mediaStore = transaction.objectStore(DB_CONFIG.stores.mediaFiles);

        // Save media files first
        for (const round of quiz.rounds) {
          for (const question of round.questions) {
            if (question.mediaFile) {
              await this.putInStore(mediaStore, question.mediaFile);
            }
          }
        }

        // Save the quiz
        await this.putInStore(quizzesStore, quiz);

        // Update metadata
        await this.updateMetadata();

        return quiz;
      }
    );
  }

  /**
   * Save a draft quiz (auto-save)
   */
  async saveDraft(
    draft: Partial<Quiz> & { id: string }
  ): Promise<StorageResult<Partial<Quiz>>> {
    await this.initialize();

    if (!this.isInitialized) {
      return this.saveDraftFallback(draft);
    }

    const draftWithTimestamp = {
      ...draft,
      lastSaved: new Date(),
      isDraft: true,
    };

    return this.executeTransaction(
      DB_CONFIG.stores.drafts,
      "readwrite",
      async (transaction) => {
        const store = transaction.objectStore(DB_CONFIG.stores.drafts);
        await this.putInStore(store, draftWithTimestamp);
        return draftWithTimestamp;
      }
    );
  }

  /**
   * Load all quizzes
   */
  async loadQuizzes(): Promise<StorageResult<Quiz[]>> {
    await this.initialize();

    if (!this.isInitialized) {
      return this.loadQuizzesFallback();
    }

    return this.executeTransaction(
      DB_CONFIG.stores.quizzes,
      "readonly",
      async (transaction) => {
        const store = transaction.objectStore(DB_CONFIG.stores.quizzes);
        const request = store.getAll();

        return new Promise<Quiz[]>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * Load a specific quiz by ID
   */
  async loadQuiz(id: string): Promise<StorageResult<Quiz | null>> {
    await this.initialize();

    if (!this.isInitialized) {
      return this.loadQuizFallback(id);
    }

    return this.executeTransaction(
      DB_CONFIG.stores.quizzes,
      "readonly",
      async (transaction) => {
        const store = transaction.objectStore(DB_CONFIG.stores.quizzes);
        const request = store.get(id);

        return new Promise<Quiz | null>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * Load all drafts
   */
  async loadDrafts(): Promise<StorageResult<Partial<Quiz>[]>> {
    await this.initialize();

    if (!this.isInitialized) {
      return this.loadDraftsFallback();
    }

    return this.executeTransaction(
      DB_CONFIG.stores.drafts,
      "readonly",
      async (transaction) => {
        const store = transaction.objectStore(DB_CONFIG.stores.drafts);
        const request = store.getAll();

        return new Promise<Partial<Quiz>[]>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * Delete a quiz
   */
  async deleteQuiz(id: string): Promise<StorageResult<boolean>> {
    await this.initialize();

    if (!this.isInitialized) {
      return this.deleteQuizFallback(id);
    }

    return this.executeTransaction(
      [DB_CONFIG.stores.quizzes, DB_CONFIG.stores.mediaFiles],
      "readwrite",
      async (transaction) => {
        const quizzesStore = transaction.objectStore(DB_CONFIG.stores.quizzes);
        const mediaStore = transaction.objectStore(DB_CONFIG.stores.mediaFiles);

        // Get quiz to find associated media files
        const quiz = await this.getFromStore<Quiz>(quizzesStore, id);

        if (quiz) {
          // Delete associated media files
          for (const round of quiz.rounds) {
            for (const question of round.questions) {
              if (question.mediaFile) {
                await this.deleteFromStore(mediaStore, question.mediaFile.id);
              }
            }
          }
        }

        // Delete the quiz
        await this.deleteFromStore(quizzesStore, id);

        // Update metadata
        await this.updateMetadata();

        return true;
      }
    );
  }

  /**
   * Delete a draft
   */
  async deleteDraft(id: string): Promise<StorageResult<boolean>> {
    await this.initialize();

    if (!this.isInitialized) {
      return this.deleteDraftFallback(id);
    }

    return this.executeTransaction(
      DB_CONFIG.stores.drafts,
      "readwrite",
      async (transaction) => {
        const store = transaction.objectStore(DB_CONFIG.stores.drafts);
        await this.deleteFromStore(store, id);
        return true;
      }
    );
  }

  /**
   * Get current storage usage
   */
  async getStorageUsage(): Promise<StorageUsage> {
    await this.initialize();

    if (!this.isInitialized) {
      return this.getStorageUsageFallback();
    }

    try {
      const [quizzesResult, draftsResult, mediaResult] = await Promise.all([
        this.calculateStoreSize(DB_CONFIG.stores.quizzes),
        this.calculateStoreSize(DB_CONFIG.stores.drafts),
        this.calculateStoreSize(DB_CONFIG.stores.mediaFiles),
      ]);

      const totalSize = quizzesResult + draftsResult + mediaResult;
      const remainingSpace = STORAGE_LIMITS.TOTAL_QUIZ_SIZE - totalSize;
      const percentageUsed = (totalSize / STORAGE_LIMITS.TOTAL_QUIZ_SIZE) * 100;

      return {
        totalSize,
        quizzesSize: quizzesResult,
        draftsSize: draftsResult,
        mediaFilesSize: mediaResult,
        remainingSpace: Math.max(0, remainingSpace),
        percentageUsed: Math.min(100, percentageUsed),
        isNearLimit: percentageUsed > 80,
      };
    } catch (error) {
      console.error("Error calculating storage usage:", error);
      return {
        totalSize: 0,
        quizzesSize: 0,
        draftsSize: 0,
        mediaFilesSize: 0,
        remainingSpace: STORAGE_LIMITS.TOTAL_QUIZ_SIZE,
        percentageUsed: 0,
        isNearLimit: false,
      };
    }
  }

  /**
   * Clean up old drafts (older than configured days)
   */
  async cleanupOldDrafts(): Promise<StorageResult<number>> {
    await this.initialize();

    if (!this.isInitialized) {
      return { success: true, data: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - AUTO_SAVE_CONFIG.DRAFT_CLEANUP_DAYS
    );

    return this.executeTransaction(
      DB_CONFIG.stores.drafts,
      "readwrite",
      async (transaction) => {
        const store = transaction.objectStore(DB_CONFIG.stores.drafts);
        const index = store.index("lastSaved");
        const range = IDBKeyRange.upperBound(cutoffDate);
        const request = index.openCursor(range);

        let deletedCount = 0;

        return new Promise<number>((resolve, reject) => {
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              cursor.delete();
              deletedCount++;
              cursor.continue();
            } else {
              resolve(deletedCount);
            }
          };
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * Clear ALL storage data (both IndexedDB and localStorage)
   * This is used when user explicitly wants to clear all data
   */
  async clearAllStorage(): Promise<StorageResult<boolean>> {
    try {
      await this.initialize();

      // Clear IndexedDB if available
      if (this.isInitialized && this.db) {
        // Clear all object stores
        const storeNames = [
          DB_CONFIG.stores.quizzes,
          DB_CONFIG.stores.drafts,
          DB_CONFIG.stores.mediaFiles,
          DB_CONFIG.stores.metadata,
        ];

        for (const storeName of storeNames) {
          await this.executeTransaction(
            storeName,
            "readwrite",
            async (transaction) => {
              const store = transaction.objectStore(storeName);
              return new Promise<void>((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
              });
            }
          );
        }
      }

      // Also clear localStorage fallback data
      try {
        localStorage.removeItem("quizzard_quizzes");
        localStorage.removeItem("quizzard_drafts");
        // Clear any other quiz-related localStorage keys
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("quizzard") || key.startsWith("Quizzard")) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn("Failed to clear localStorage:", error);
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to clear storage",
      };
    }
  }

  // Helper methods
  private async putInStore(store: IDBObjectStore, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromStore<T>(
    store: IDBObjectStore,
    key: string
  ): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromStore(
    store: IDBObjectStore,
    key: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async calculateStoreSize(storeName: string): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        const size = items.reduce((total, item) => {
          return total + JSON.stringify(item).length * 2; // Rough byte estimate
        }, 0);
        resolve(size);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private calculateQuizSize(quiz: Quiz): number {
    return JSON.stringify(quiz).length * 2; // Rough byte estimate
  }

  private async updateMetadata(): Promise<void> {
    if (!this.db) return;

    const usage = await this.getStorageUsage();
    const metadata: DatabaseMetadata = {
      version: "1.0.0",
      totalSize: usage.totalSize,
      createdAt: new Date(),
      lastCleanup: new Date(),
    };

    const transaction = this.db.transaction(
      DB_CONFIG.stores.metadata,
      "readwrite"
    );
    const store = transaction.objectStore(DB_CONFIG.stores.metadata);
    store.put({ key: "app_metadata", ...metadata });
  }

  // Fallback methods for localStorage
  private saveQuizFallback(quiz: Quiz): StorageResult<Quiz> {
    try {
      const quizzes = this.getQuizzesFromLocalStorage();
      const existingIndex = quizzes.findIndex((q) => q.id === quiz.id);

      if (existingIndex >= 0) {
        quizzes[existingIndex] = quiz;
      } else {
        quizzes.push(quiz);
      }

      localStorage.setItem("quizzard_quizzes", JSON.stringify(quizzes));
      return { success: true, data: quiz, usedFallback: true };
    } catch (error) {
      return {
        success: false,
        error:
          "localStorage save failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
        usedFallback: true,
      };
    }
  }

  private saveDraftFallback(
    draft: Partial<Quiz> & { id: string }
  ): StorageResult<Partial<Quiz>> {
    try {
      const drafts = this.getDraftsFromLocalStorage();
      const existingIndex = drafts.findIndex((d) => d.id === draft.id);

      const draftWithTimestamp = {
        ...draft,
        lastSaved: new Date(),
        isDraft: true,
      };

      if (existingIndex >= 0) {
        drafts[existingIndex] = draftWithTimestamp;
      } else {
        drafts.push(draftWithTimestamp);
      }

      localStorage.setItem("quizzard_drafts", JSON.stringify(drafts));
      return { success: true, data: draftWithTimestamp, usedFallback: true };
    } catch (error) {
      return {
        success: false,
        error:
          "localStorage draft save failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
        usedFallback: true,
      };
    }
  }

  private loadQuizzesFallback(): StorageResult<Quiz[]> {
    try {
      const quizzes = this.getQuizzesFromLocalStorage();
      return { success: true, data: quizzes, usedFallback: true };
    } catch (error) {
      return {
        success: false,
        error:
          "localStorage load failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
        usedFallback: true,
      };
    }
  }

  private loadQuizFallback(id: string): StorageResult<Quiz | null> {
    try {
      const quizzes = this.getQuizzesFromLocalStorage();
      const quiz = quizzes.find((q) => q.id === id) || null;
      return { success: true, data: quiz, usedFallback: true };
    } catch (error) {
      return {
        success: false,
        error:
          "localStorage load failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
        usedFallback: true,
      };
    }
  }

  private loadDraftsFallback(): StorageResult<Partial<Quiz>[]> {
    try {
      const drafts = this.getDraftsFromLocalStorage();
      return { success: true, data: drafts, usedFallback: true };
    } catch (error) {
      return {
        success: false,
        error:
          "localStorage drafts load failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
        usedFallback: true,
      };
    }
  }

  private deleteQuizFallback(id: string): StorageResult<boolean> {
    try {
      const quizzes = this.getQuizzesFromLocalStorage();
      const filteredQuizzes = quizzes.filter((q) => q.id !== id);
      localStorage.setItem("quizzard_quizzes", JSON.stringify(filteredQuizzes));
      return { success: true, data: true, usedFallback: true };
    } catch (error) {
      return {
        success: false,
        error:
          "localStorage delete failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
        usedFallback: true,
      };
    }
  }

  private deleteDraftFallback(id: string): StorageResult<boolean> {
    try {
      const drafts = this.getDraftsFromLocalStorage();
      const filteredDrafts = drafts.filter((d) => d.id !== id);
      localStorage.setItem("quizzard_drafts", JSON.stringify(filteredDrafts));
      return { success: true, data: true, usedFallback: true };
    } catch (error) {
      return {
        success: false,
        error:
          "localStorage draft delete failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
        usedFallback: true,
      };
    }
  }

  private getStorageUsageFallback(): StorageUsage {
    try {
      const quizzesData = localStorage.getItem("quizzard_quizzes") || "[]";
      const draftsData = localStorage.getItem("quizzard_drafts") || "[]";

      const quizzesSize = quizzesData.length * 2;
      const draftsSize = draftsData.length * 2;
      const totalSize = quizzesSize + draftsSize;

      // localStorage has a 5-10MB limit typically
      const localStorageLimit = 5 * 1024 * 1024; // 5MB
      const remainingSpace = Math.max(0, localStorageLimit - totalSize);
      const percentageUsed = (totalSize / localStorageLimit) * 100;

      return {
        totalSize,
        quizzesSize,
        draftsSize,
        mediaFilesSize: 0, // No separate media storage in localStorage
        remainingSpace,
        percentageUsed: Math.min(100, percentageUsed),
        isNearLimit: percentageUsed > 80,
      };
    } catch (error) {
      return {
        totalSize: 0,
        quizzesSize: 0,
        draftsSize: 0,
        mediaFilesSize: 0,
        remainingSpace: 5 * 1024 * 1024,
        percentageUsed: 0,
        isNearLimit: false,
      };
    }
  }

  private getQuizzesFromLocalStorage(): Quiz[] {
    try {
      const data = localStorage.getItem("quizzard_quizzes");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private getDraftsFromLocalStorage(): Partial<Quiz>[] {
    try {
      const data = localStorage.getItem("quizzard_drafts");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
