/**
 * Background Sync Service - Phase 4
 * Following DEVELOPMENT-STANDARDS.md: Emphasis on error handling, robustness
 */

import { tokenRefresh } from "./tokenRefresh";
import { authStorage } from "./authStorage";

export interface SessionWarningConfig {
  warningTimeMinutes: number;
  autoLogoutMinutes: number;
  syncIntervalMinutes: number;
}

const DEFAULT_CONFIG: SessionWarningConfig = {
  warningTimeMinutes: 10, // Warn 10 minutes before expiry
  autoLogoutMinutes: 60, // Auto logout after 1 hour inactivity
  syncIntervalMinutes: 30, // Sync every 30 minutes
};

class BackgroundSyncService {
  private config: SessionWarningConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private warningTimeout: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isRunning = false;

  constructor(config: Partial<SessionWarningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start background sync and session management
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.updateActivity();

    // Set up periodic token refresh
    this.syncInterval = setInterval(async () => {
      await this.performBackgroundSync();
    }, this.config.syncIntervalMinutes * 60 * 1000);

    // Set up activity tracking
    this.setupActivityTracking();

    console.log("Background sync service started");
  }

  /**
   * Stop background sync
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }

    this.isRunning = false;
    console.log("Background sync service stopped");
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.lastActivity = Date.now();
    this.scheduleSessionWarning();
  }

  /**
   * Perform background token refresh
   */
  private async performBackgroundSync(): Promise<void> {
    try {
      const shouldRefresh = await tokenRefresh.shouldRefreshToken();

      if (shouldRefresh) {
        console.log("Performing background token refresh");
        const result = await tokenRefresh.refreshToken();

        if (result.success) {
          console.log("Background token refresh successful");
        } else {
          console.warn("Background token refresh failed:", result.error);
        }
      }
    } catch (error) {
      console.error("Background sync error:", error);
    }
  }

  /**
   * Set up activity tracking for auto-logout
   */
  private setupActivityTracking(): void {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    const handleActivity = () => {
      this.updateActivity();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
  }

  /**
   * Schedule session warning before auto-logout
   */
  private scheduleSessionWarning(): void {
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }

    const warningDelay =
      (this.config.autoLogoutMinutes - this.config.warningTimeMinutes) *
      60 *
      1000;

    this.warningTimeout = setTimeout(() => {
      this.showSessionWarning();
    }, warningDelay);
  }

  /**
   * Show session timeout warning to user
   */
  private showSessionWarning(): void {
    console.log("Session will expire soon - user should be warned");
    // This would trigger a UI notification in real implementation

    // Schedule auto-logout
    setTimeout(() => {
      this.handleAutoLogout();
    }, this.config.warningTimeMinutes * 60 * 1000);
  }

  /**
   * Handle automatic logout due to inactivity
   */
  private async handleAutoLogout(): Promise<void> {
    const inactiveTime = Date.now() - this.lastActivity;
    const maxInactiveTime = this.config.autoLogoutMinutes * 60 * 1000;

    if (inactiveTime >= maxInactiveTime) {
      console.log("Auto-logout due to inactivity");
      await authStorage.deleteAuthData();
      window.location.reload();
    }
  }

  /**
   * Get current sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastActivity: this.lastActivity,
      config: this.config,
    };
  }
}

// Export singleton instance
export const backgroundSync = new BackgroundSyncService();
export { BackgroundSyncService };
