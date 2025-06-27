/**
 * Token Refresh Service Tests (Simplified)
 *
 * Tests for core token refresh functionality with simplified approach.
 * Focuses on essential functionality rather than complex edge cases.
 */

import { TokenRefreshService, tokenRefresh } from "../../services/tokenRefresh";
import { authStorage } from "../../services/authStorage";

// Mock authStorage
jest.mock("../../services/authStorage", () => ({
  authStorage: {
    loadAuthData: jest.fn(),
    saveAuthData: jest.fn(),
  },
}));

const mockAuthStorage = authStorage as jest.Mocked<typeof authStorage>;

describe("TokenRefreshService (Simplified)", () => {
  let service: TokenRefreshService;

  beforeEach(() => {
    service = new TokenRefreshService();
    jest.clearAllMocks();
    service.resetState();
  });

  describe("shouldRefreshToken", () => {
    it("should return false when no auth data exists", async () => {
      mockAuthStorage.loadAuthData.mockResolvedValue(null);

      const result = await service.shouldRefreshToken();

      expect(result).toBe(false);
    });

    it("should return false when token has no expiry", async () => {
      mockAuthStorage.loadAuthData.mockResolvedValue({
        token: { access_token: "test" },
        user: null,
        timestamp: Date.now(),
      });

      const result = await service.shouldRefreshToken();

      expect(result).toBe(false);
    });

    it("should return true when token is close to expiry", async () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000; // 1 hour ago

      mockAuthStorage.loadAuthData.mockResolvedValue({
        token: {
          access_token: "test",
          expires_in: 3600, // 1 hour
        },
        user: null,
        timestamp: oneHourAgo,
      });

      const result = await service.shouldRefreshToken();

      expect(result).toBe(true);
    });
  });

  describe("refreshToken", () => {
    it("should prevent concurrent refresh attempts", async () => {
      mockAuthStorage.loadAuthData.mockResolvedValue({
        token: { access_token: "test" },
        user: null,
        timestamp: Date.now(),
      });

      // Start first refresh
      const firstRefresh = service.refreshToken();

      // Try second refresh immediately
      const secondRefresh = service.refreshToken();

      const [firstResult, secondResult] = await Promise.all([
        firstRefresh,
        secondRefresh,
      ]);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBe("Refresh already in progress");
    });

    it("should handle refresh when no token available", async () => {
      mockAuthStorage.loadAuthData.mockResolvedValue(null);

      const result = await service.refreshToken();

      expect(result.success).toBe(false);
      expect(result.error).toBe("No access token available");
    });

    it("should successfully refresh token", async () => {
      const authData = {
        token: { access_token: "test" },
        user: { email: "test@example.com" },
        timestamp: Date.now(),
      };

      mockAuthStorage.loadAuthData.mockResolvedValue(authData);
      mockAuthStorage.saveAuthData.mockResolvedValue();

      const result = await service.refreshToken();

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(mockAuthStorage.saveAuthData).toHaveBeenCalled();
    });

    it("should retry with exponential backoff on failure", async () => {
      const startTime = Date.now();
      // Mock loadAuthData to return a valid token so refreshToken proceeds to attemptRefresh
      mockAuthStorage.loadAuthData.mockResolvedValue({
        token: { access_token: "test" },
        user: null,
        timestamp: Date.now(),
      });
      // Spy on performGoogleRefresh and make it throw
      const serviceSpy = jest
        .spyOn(service as any, "performGoogleRefresh")
        .mockImplementation(() => {
          return Promise.reject(new Error("Network error"));
        });
      const result = await service.refreshToken();
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Failed to refresh token after 3 attempts/);
      // Should have taken some time due to retries
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThan(1000); // At least 1 second
      serviceSpy.mockRestore();
    });
  });

  describe("getRefreshStatus", () => {
    it("should return correct initial status", () => {
      const status = service.getRefreshStatus();

      expect(status.isRefreshing).toBe(false);
      expect(status.retryCount).toBe(0);
      expect(status.lastRefreshTime).toBe(0);
    });

    it("should return correct status after refresh", async () => {
      mockAuthStorage.loadAuthData.mockResolvedValue({
        token: { access_token: "test" },
        user: null,
        timestamp: Date.now(),
      });
      mockAuthStorage.saveAuthData.mockResolvedValue();

      await service.refreshToken();

      const status = service.getRefreshStatus();
      expect(status.isRefreshing).toBe(false);
      expect(status.lastRefreshTime).toBeGreaterThan(0);
    });
  });
});

describe("tokenRefresh singleton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenRefresh.resetState();
  });

  it("should provide singleton instance", () => {
    expect(tokenRefresh).toBeInstanceOf(TokenRefreshService);
  });

  it("should handle basic refresh flow", async () => {
    mockAuthStorage.loadAuthData.mockResolvedValue({
      token: { access_token: "test" },
      user: null,
      timestamp: Date.now(),
    });
    mockAuthStorage.saveAuthData.mockResolvedValue();

    const result = await tokenRefresh.refreshToken();

    expect(result.success).toBe(true);
  });
});
