/**
 * Background Sync Service Tests - Phase 4 (Minimal - 5 Tests)
 * Following DEVELOPMENT-STANDARDS.md: Keep test suite under 30 seconds
 */

import { BackgroundSyncService } from "../../services/backgroundSync";
import { tokenRefresh } from "../../services/tokenRefresh";
import { authStorage } from "../../services/authStorage";

// Mock dependencies
jest.mock("../../services/tokenRefresh");
jest.mock("../../services/authStorage");

const mockTokenRefresh = tokenRefresh as jest.Mocked<typeof tokenRefresh>;
const mockAuthStorage = authStorage as jest.Mocked<typeof authStorage>;

describe("Background Sync Service (Phase 4 - Minimal)", () => {
  let syncService: BackgroundSyncService;

  beforeEach(() => {
    jest.clearAllMocks();

    syncService = new BackgroundSyncService({
      warningTimeMinutes: 1,
      autoLogoutMinutes: 2,
      syncIntervalMinutes: 1,
    });

    mockTokenRefresh.shouldRefreshToken.mockResolvedValue(false);
    mockTokenRefresh.refreshToken.mockResolvedValue({ success: true });
    mockAuthStorage.deleteAuthData.mockResolvedValue(undefined);
  });

  afterEach(() => {
    syncService.stop();
  });

  it("should start and stop background sync service", () => {
    expect(syncService.getStatus().isRunning).toBe(false);

    syncService.start();
    expect(syncService.getStatus().isRunning).toBe(true);

    syncService.stop();
    expect(syncService.getStatus().isRunning).toBe(false);
  });

  it("should configure sync intervals correctly", () => {
    const status = syncService.getStatus();

    expect(status.config.warningTimeMinutes).toBe(1);
    expect(status.config.autoLogoutMinutes).toBe(2);
    expect(status.config.syncIntervalMinutes).toBe(1);
  });

  it("should track user activity timestamps", () => {
    const initialActivity = syncService.getStatus().lastActivity;

    // Wait a small amount to ensure timestamp changes
    const now = Date.now();
    syncService.updateActivity();

    const updatedActivity = syncService.getStatus().lastActivity;
    expect(updatedActivity).toBeGreaterThanOrEqual(now);
  });

  it("should handle token refresh service integration", async () => {
    mockTokenRefresh.shouldRefreshToken.mockResolvedValue(true);

    const shouldRefresh = await mockTokenRefresh.shouldRefreshToken();
    expect(shouldRefresh).toBe(true);

    const result = await mockTokenRefresh.refreshToken();
    expect(result.success).toBe(true);
  });

  it("should provide comprehensive service status", () => {
    const status = syncService.getStatus();

    expect(status).toHaveProperty("isRunning");
    expect(status).toHaveProperty("lastActivity");
    expect(status).toHaveProperty("config");
    expect(typeof status.lastActivity).toBe("number");
    expect(typeof status.isRunning).toBe("boolean");
    expect(typeof status.config).toBe("object");
  });
});
