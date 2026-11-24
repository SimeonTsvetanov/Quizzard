import { describe, expect, it } from "vitest";
import { isAppleTouch, signedNumberMode } from "../../src/lib/keyboard-mode";

const IPHONE = { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1", platform: "iPhone", maxTouchPoints: 5 };
const IPHONE_CHROME = { ...IPHONE, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.0.0 Mobile/15E148 Safari/604.1" };
const IPAD = { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15", platform: "MacIntel", maxTouchPoints: 5 };
const MAC = { ...IPAD, maxTouchPoints: 0 };
const ANDROID = { userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36", platform: "Linux armv81", maxTouchPoints: 5 };
const WINDOWS = { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36", platform: "Win32", maxTouchPoints: 0 };

describe("the keyboard of a signed number field", () => {
  it("gives no hint on an iPhone or iPad, in any browser there: the keyboard with the minus opens", () => {
    for (const agent of [IPHONE, IPHONE_CHROME, IPAD]) {
      expect(isAppleTouch(agent)).toBe(true);
      expect(signedNumberMode(agent)).toBeUndefined();
    }
  });

  it("keeps the number pad everywhere else — Android's has the minus", () => {
    for (const agent of [ANDROID, WINDOWS, MAC]) {
      expect(isAppleTouch(agent)).toBe(false);
      expect(signedNumberMode(agent)).toBe("numeric");
    }
  });
});
