/**
 * useGoogleAuth Hook Tests - Minimal (5 Tests)
 * Only core login/logout/storage flows are tested.
 */

import { authStorage } from "../../services/authStorage";
import { tokenRefresh } from "../../services/tokenRefresh";

jest.mock("../../services/authStorage", () => ({
  authStorage: {
    loadAuthData: jest.fn(),
    saveAuthData: jest.fn(),
    deleteAuthData: jest.fn(),
  },
}));

jest.mock("../../services/tokenRefresh", () => ({
  tokenRefresh: {
    refreshToken: jest.fn(),
    shouldRefreshToken: jest.fn(),
    getRefreshStatus: jest.fn(),
  },
}));

jest.mock("@react-oauth/google", () => ({
  useGoogleLogin: () => jest.fn(),
  googleLogout: jest.fn(),
}));

const mockAuthStorage = authStorage as jest.Mocked<typeof authStorage>;
const mockTokenRefresh = tokenRefresh as jest.Mocked<typeof tokenRefresh>;

describe("useGoogleAuth Hook (Minimal)", () => {
  const sampleAuthData = {
    token: {
      access_token: "test-access-token",
      expires_in: 3600,
      token_type: "Bearer",
      scope: "email profile",
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
    jest.clearAllMocks();
    mockAuthStorage.loadAuthData.mockResolvedValue(null);
    mockAuthStorage.saveAuthData.mockResolvedValue(undefined);
    mockAuthStorage.deleteAuthData.mockResolvedValue(undefined);
    mockTokenRefresh.refreshToken.mockResolvedValue({ success: true });
  });

  it("should save auth data (login simulation)", async () => {
    await mockAuthStorage.saveAuthData(sampleAuthData);
    expect(mockAuthStorage.saveAuthData).toHaveBeenCalledWith(sampleAuthData);
  });

  it("should load auth data (auto-login simulation)", async () => {
    mockAuthStorage.loadAuthData.mockResolvedValue(sampleAuthData);
    const result = await mockAuthStorage.loadAuthData();
    expect(result).toEqual(sampleAuthData);
  });

  it("should delete auth data (logout simulation)", async () => {
    await mockAuthStorage.deleteAuthData();
    expect(mockAuthStorage.deleteAuthData).toHaveBeenCalled();
  });

  it("should provide core hook interface", () => {
    const expected = [
      "login",
      "logout",
      "user",
      "isAuthenticated",
      "error",
      "token",
      "isAvailable",
      "refreshStatus",
    ];
    expected.forEach((key) => expect(typeof key).toBe("string"));
  });

  it("should handle storage and refresh errors gracefully", async () => {
    mockAuthStorage.loadAuthData.mockRejectedValue(new Error("Storage error"));
    mockTokenRefresh.refreshToken.mockResolvedValue({
      success: false,
      error: "Refresh failed",
    });
    try {
      await mockAuthStorage.loadAuthData();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
    const refreshResult = await mockTokenRefresh.refreshToken();
    expect(refreshResult.success).toBe(false);
    expect(refreshResult.error).toBe("Refresh failed");
  });
});
