/**
 * IndexedDB Mock for Testing
 *
 * Provides a complete mock of IndexedDB operations for testing
 * storage-related functionality without requiring a real database.
 *
 * @fileoverview IndexedDB mock implementation
 * @version 1.0.0
 * @since December 2025
 */

// Mock IDBRequest
class MockIDBRequest {
  result: any;
  error: any;
  source: any;
  transaction: any;
  readyState: string;
  onsuccess: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  constructor() {
    this.readyState = "pending";
  }

  triggerSuccess(result: any) {
    this.result = result;
    this.readyState = "done";
    if (this.onsuccess) {
      this.onsuccess({ target: this });
    }
  }

  triggerError(error: any) {
    this.error = error;
    this.readyState = "done";
    if (this.onerror) {
      this.onerror({ target: this });
    }
  }
}

// Mock IDBTransaction
class MockIDBTransaction {
  objectStoreNames: DOMStringList;
  mode: string;
  db: any;
  error: any;
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor(storeNames: string[], mode: string, db: any) {
    this.objectStoreNames = storeNames as any;
    this.mode = mode;
    this.db = db;
  }

  objectStore(name: string) {
    return this.db.objectStores[name];
  }

  commit() {
    if (this.oncomplete) {
      this.oncomplete();
    }
  }

  abort() {
    if (this.onabort) {
      this.onabort();
    }
  }
}

// Mock IDBObjectStore
class MockIDBObjectStore {
  name: string;
  keyPath: string | string[];
  indexNames: DOMStringList;
  transaction: any;
  autoIncrement: boolean;
  data: Map<string, any>;

  constructor(name: string, options: any = {}) {
    this.name = name;
    this.keyPath = options.keyPath || "id";
    this.indexNames = [] as any;
    this.autoIncrement = options.autoIncrement || false;
    this.data = new Map();
  }

  add(value: any, key?: any): MockIDBRequest {
    const request = new MockIDBRequest();

    setTimeout(() => {
      const id = key || value.id || Date.now().toString();
      this.data.set(id, value);
      request.triggerSuccess(id);
    }, 0);

    return request;
  }

  put(value: any, key?: any): MockIDBRequest {
    const request = new MockIDBRequest();

    setTimeout(() => {
      const id = key || value.id || Date.now().toString();
      this.data.set(id, value);
      request.triggerSuccess(id);
    }, 0);

    return request;
  }

  get(key: any): MockIDBRequest {
    const request = new MockIDBRequest();

    setTimeout(() => {
      const value = this.data.get(key);
      request.triggerSuccess(value || undefined);
    }, 0);

    return request;
  }

  getAll(query?: any, count?: number): MockIDBRequest {
    const request = new MockIDBRequest();

    setTimeout(() => {
      const values = Array.from(this.data.values());
      request.triggerSuccess(values);
    }, 0);

    return request;
  }

  delete(key: any): MockIDBRequest {
    const request = new MockIDBRequest();

    setTimeout(() => {
      this.data.delete(key);
      request.triggerSuccess(undefined);
    }, 0);

    return request;
  }

  clear(): MockIDBRequest {
    const request = new MockIDBRequest();

    setTimeout(() => {
      this.data.clear();
      request.triggerSuccess(undefined);
    }, 0);

    return request;
  }

  createIndex(name: string, keyPath: string | string[], options?: any) {
    // Mock index creation
    return {
      name,
      keyPath,
      options,
    };
  }

  index(name: string) {
    // Mock index access
    return {
      get: (key: any) => this.get(key),
      getAll: (query?: any, count?: number) => this.getAll(query, count),
    };
  }
}

// Mock IDBDatabase
class MockIDBDatabase {
  name: string;
  version: number;
  objectStoreNames: DOMStringList;
  objectStores: Record<string, MockIDBObjectStore>;
  onversionchange: (() => void) | null = null;

  constructor(name: string, version: number) {
    this.name = name;
    this.version = version;
    this.objectStoreNames = [] as any;
    this.objectStores = {};
  }

  createObjectStore(name: string, options: any = {}) {
    const store = new MockIDBObjectStore(name, options);
    this.objectStores[name] = store;
    this.objectStoreNames = Object.keys(this.objectStores) as any;
    return store;
  }

  deleteObjectStore(name: string) {
    delete this.objectStores[name];
    this.objectStoreNames = Object.keys(this.objectStores) as any;
  }

  transaction(storeNames: string | string[], mode: string = "readonly") {
    return new MockIDBTransaction(
      Array.isArray(storeNames) ? storeNames : [storeNames],
      mode,
      this
    );
  }

  close() {
    // Mock database close
  }
}

// Setup mock IndexedDB
const setupMockIndexedDB = () => {
  const databases = new Map<string, MockIDBDatabase>();

  const indexedDBMock = {
    open: jest.fn((name: string, version?: number) => {
      const request = new MockIDBRequest();

      setTimeout(() => {
        let db = databases.get(name);

        if (!db) {
          db = new MockIDBDatabase(name, version || 1);
          databases.set(name, db);
        } else if (version && version > db.version) {
          // Mock version upgrade
          db.version = version;
        }

        request.triggerSuccess(db);
      }, 0);

      return request;
    }),

    deleteDatabase: jest.fn((name: string) => {
      const request = new MockIDBRequest();

      setTimeout(() => {
        databases.delete(name);
        request.triggerSuccess(undefined);
      }, 0);

      return request;
    }),

    databases: jest.fn(),
  };

  return {
    indexedDBMock,
    databases,
    MockIDBRequest,
    MockIDBTransaction,
    MockIDBObjectStore,
    MockIDBDatabase,
  };
};

// Export mock setup
export const { indexedDBMock, databases } = setupMockIndexedDB();

// Mock global IndexedDB
Object.defineProperty(window, "indexedDB", {
  value: indexedDBMock,
  writable: true,
});

// Mock global IDBRequest
Object.defineProperty(window, "IDBRequest", {
  value: MockIDBRequest,
  writable: true,
});

// Mock global IDBTransaction
Object.defineProperty(window, "IDBTransaction", {
  value: MockIDBTransaction,
  writable: true,
});

// Mock global IDBObjectStore
Object.defineProperty(window, "IDBObjectStore", {
  value: MockIDBObjectStore,
  writable: true,
});

// Mock global IDBDatabase
Object.defineProperty(window, "IDBDatabase", {
  value: MockIDBDatabase,
  writable: true,
});

export default indexedDBMock;
