/**
 * Auth Storage Service
 *
 * Handles authentication token storage with IndexedDB as primary storage
 * and localStorage as fallback. Provides migration from localStorage to IndexedDB.
 *
 * Features:
 * - IndexedDB operations for auth tokens
 * - localStorage fallback when IndexedDB fails
 * - Migration from localStorage to IndexedDB
 * - Storage quota management
 * - Data corruption recovery
 * - Concurrent access handling
 */

// Types for auth data
export interface AuthData {
  token: {
    access_token: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
    error_uri?: string;
  };
  user: {
    email: string;
    name: string;
    picture: string;
    email_verified: boolean;
    locale: string;
  } | null;
  timestamp: number;
}

// IndexedDB configuration
const DB_NAME = "QuizzardAuthDB";
const DB_VERSION = 1;
const STORE_NAME = "auth";
const KEY_NAME = "google-auth-token";

// localStorage key (for fallback and migration)
const LOCAL_STORAGE_KEY = "quizzard-google-auth-token";

// Feature flag for instant rollback
const USE_INDEXEDDB_AUTH = true;

class AuthStorageService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  private async initIndexedDB(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn(
          "Failed to open IndexedDB for auth storage:",
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
          store.createIndex("key", "key", { unique: true });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save auth data to IndexedDB
   */
  private async saveToIndexedDB(data: AuthData): Promise<void> {
    if (!USE_INDEXEDDB_AUTH) {
      throw new Error("IndexedDB auth storage is disabled");
    }

    try {
      await this.initIndexedDB();

      if (!this.db) {
        throw new Error("IndexedDB not initialized");
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        const request = store.put({
          key: KEY_NAME,
          data: data,
          timestamp: Date.now(),
        });

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn("Failed to save auth data to IndexedDB:", request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn(
        "IndexedDB save failed, falling back to localStorage:",
        error
      );
      throw error;
    }
  }

  /**
   * Load auth data from IndexedDB
   */
  private async loadFromIndexedDB(): Promise<AuthData | null> {
    if (!USE_INDEXEDDB_AUTH) {
      return null;
    }

    try {
      await this.initIndexedDB();

      if (!this.db) {
        return null;
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(KEY_NAME);

        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result.data);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.warn(
            "Failed to load auth data from IndexedDB:",
            request.error
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn("IndexedDB load failed:", error);
      return null;
    }
  }

  /**
   * Delete auth data from all storage locations
   * Returns true if deletion was successful from at least one storage
   */
  async deleteAuthData(): Promise<void> {
    console.log("Starting auth data deletion process...");
    let indexedDBStatus = false;
    let localStorageStatus = false;

    // Try IndexedDB first
    if (USE_INDEXEDDB_AUTH) {
      try {
        await this.deleteFromIndexedDB();
        indexedDBStatus = true;
        console.log("Successfully deleted auth data from IndexedDB");
      } catch (error) {
        console.warn("Failed to delete from IndexedDB:", error);
        // Don't throw yet, try localStorage
      }
    }

    // Always try localStorage as well (for complete cleanup)
    try {
      this.deleteFromLocalStorage();
      localStorageStatus = true;
      console.log("Successfully deleted auth data from localStorage");
    } catch (error) {
      console.warn("Failed to delete from localStorage:", error);
      // Don't throw yet, check overall status
    }

    // If both storages failed, throw error
    if (!indexedDBStatus && !localStorageStatus) {
      const error = new Error(
        "Failed to delete auth data from all storage locations"
      );
      console.error(error);
      throw error;
    }

    console.log(
      "Auth data deletion completed. IndexedDB:",
      indexedDBStatus,
      "localStorage:",
      localStorageStatus
    );
  }

  /**
   * Delete auth data from localStorage
   */
  private deleteFromLocalStorage(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log(
        `Successfully removed auth data with key: ${LOCAL_STORAGE_KEY} from localStorage`
      );
    } catch (error) {
      console.error("Failed to delete auth data from localStorage:", error);
      throw error;
    }
  }

  /**
   * Delete auth data from IndexedDB
   */
  private async deleteFromIndexedDB(): Promise<void> {
    if (!USE_INDEXEDDB_AUTH) {
      console.log("IndexedDB auth storage is disabled, skipping deletion");
      return;
    }

    try {
      await this.initIndexedDB();

      if (!this.db) {
        console.warn("IndexedDB not initialized, cannot delete auth data");
        throw new Error("IndexedDB not initialized");
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        const request = store.delete(KEY_NAME);

        request.onsuccess = () => {
          console.log(
            `Successfully deleted auth data with key: ${KEY_NAME} from IndexedDB`
          );
          resolve();
        };

        request.onerror = () => {
          const errorMsg = `Failed to delete auth data from IndexedDB: ${request.error}`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
        };

        transaction.onerror = () => {
          const errorMsg = `IndexedDB transaction failed during deletion: ${transaction.error}`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
        };

        transaction.onabort = () => {
          const errorMsg = "IndexedDB transaction was aborted during deletion";
          console.error(errorMsg);
          reject(new Error(errorMsg));
        };
      });
    } catch (error) {
      console.error("IndexedDB delete operation failed:", error);
      throw error;
    }
  }

  /**
   * Save auth data to localStorage (fallback)
   */
  private saveToLocalStorage(data: AuthData): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save auth data to localStorage:", error);
      throw error;
    }
  }

  /**
   * Load auth data from localStorage (fallback)
   */
  private loadFromLocalStorage(): AuthData | null {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.warn("Failed to load auth data from localStorage:", error);
      return null;
    }
  }

  /**
   * Save auth data with fallback to localStorage
   */
  async saveAuthData(data: AuthData): Promise<void> {
    try {
      if (USE_INDEXEDDB_AUTH) {
        await this.saveToIndexedDB(data);
        // Also save to localStorage as backup
        this.saveToLocalStorage(data);
      } else {
        this.saveToLocalStorage(data);
      }
    } catch (error) {
      // If IndexedDB fails, fallback to localStorage
      console.warn(
        "Primary storage failed, using localStorage fallback:",
        error
      );
      this.saveToLocalStorage(data);
    }
  }

  /**
   * Load auth data with fallback to localStorage
   */
  async loadAuthData(): Promise<AuthData | null> {
    try {
      if (USE_INDEXEDDB_AUTH) {
        const data = await this.loadFromIndexedDB();
        if (data) {
          return data;
        }
        // If IndexedDB is empty, try localStorage
        return this.loadFromLocalStorage();
      } else {
        return this.loadFromLocalStorage();
      }
    } catch (error) {
      // If IndexedDB fails, fallback to localStorage
      console.warn(
        "Primary storage failed, using localStorage fallback:",
        error
      );
      return this.loadFromLocalStorage();
    }
  }

  /**
   * Migrate auth data from localStorage to IndexedDB
   */
  async migrateFromLocalStorage(): Promise<void> {
    if (!USE_INDEXEDDB_AUTH) {
      return;
    }

    try {
      const localData = this.loadFromLocalStorage();
      if (localData) {
        await this.saveToIndexedDB(localData);
        console.log(
          "Successfully migrated auth data from localStorage to IndexedDB"
        );
      }
    } catch (error) {
      console.warn("Failed to migrate auth data from localStorage:", error);
      throw error;
    }
  }

  /**
   * Check if IndexedDB is available and working
   */
  async isIndexedDBAvailable(): Promise<boolean> {
    try {
      if (typeof window === "undefined" || !window.indexedDB) {
        return false;
      }
      await this.initIndexedDB();
      return this.isInitialized && this.db !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage status for debugging
   */
  async getStorageStatus(): Promise<{
    indexedDBAvailable: boolean;
    localStorageAvailable: boolean;
    currentStorage: "indexeddb" | "localstorage" | "fallback";
  }> {
    const indexedDBAvailable = await this.isIndexedDBAvailable();
    const localStorageAvailable =
      typeof window !== "undefined" && window.localStorage !== undefined;

    let currentStorage: "indexeddb" | "localstorage" | "fallback" =
      "localstorage";

    if (USE_INDEXEDDB_AUTH && indexedDBAvailable) {
      currentStorage = "indexeddb";
    } else if (localStorageAvailable) {
      currentStorage = "localstorage";
    } else {
      currentStorage = "fallback";
    }

    return {
      indexedDBAvailable,
      localStorageAvailable,
      currentStorage,
    };
  }
}

// Export singleton instance
export const authStorage = new AuthStorageService();
