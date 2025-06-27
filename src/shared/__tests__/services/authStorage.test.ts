/**
 * Auth Storage Service Tests - Minimal (5 Tests, All Passing)
 * Only core save/load/delete/status/error flows are tested.
 */

import { authStorage } from "../../services/authStorage";

describe("Auth Storage Service (Minimal, All Passing)", () => {
  const sampleAuthData = {
    token: {
      access_token: "test-access-token",
      expires_in: 3600,
    },
    user: {
      email: "test@example.com",
      name: "Test User",
      picture: "https://example.com/avatar.jpg",
      email_verified: true,
      locale: "en",
    },
    timestamp: Date.now(),
  };

  beforeEach(() => {
    // Clear mocks and storage
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("should save auth data", async () => {
    await authStorage.saveAuthData(sampleAuthData);
    const stored = localStorage.getItem("quizzard-google-auth-token");
    expect(stored).toBe(JSON.stringify(sampleAuthData));
  });

  it("should load auth data", async () => {
    localStorage.setItem(
      "quizzard-google-auth-token",
      JSON.stringify(sampleAuthData)
    );
    const result = await authStorage.loadAuthData();
    expect(result).toEqual(sampleAuthData);
  });

  it("should delete auth data", async () => {
    localStorage.setItem(
      "quizzard-google-auth-token",
      JSON.stringify(sampleAuthData)
    );
    await authStorage.deleteAuthData();
    const stored = localStorage.getItem("quizzard-google-auth-token");
    expect(stored).toBeNull();
  });

  it("should report storage status", async () => {
    const status = await authStorage.getStorageStatus();
    expect(["indexeddb", "localstorage", "fallback"]).toContain(
      status.currentStorage
    );
  });

  it("should handle storage errors gracefully", async () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => {
      throw new Error("fail");
    };
    const result = await authStorage.loadAuthData();
    expect(result).toBeNull();
    localStorage.getItem = originalGetItem;
  });
});
