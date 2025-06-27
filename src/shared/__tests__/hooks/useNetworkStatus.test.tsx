/**
 * useNetworkStatus Hook Tests - Minimal, React 18/19 Compatible
 */

import React from "react";
import { render, act } from "@testing-library/react";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

function TestComponent() {
  const status = useNetworkStatus();
  return (
    <div>
      <span data-testid="isOnline">{String(status.isOnline)}</span>
      <span data-testid="lastChecked">{status.lastChecked}</span>
    </div>
  );
}

describe("useNetworkStatus Hook (Minimal, React 18/19 Compatible)", () => {
  it("should return initial online status", () => {
    const { getByTestId } = render(<TestComponent />);
    expect(["true", "false"]).toContain(getByTestId("isOnline").textContent);
    expect(Number(getByTestId("lastChecked").textContent)).toBeGreaterThan(0);
  });

  it("should detect offline status", () => {
    const { getByTestId } = render(<TestComponent />);
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(getByTestId("isOnline").textContent).toBe("false");
  });

  it("should detect online status", () => {
    const { getByTestId } = render(<TestComponent />);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(getByTestId("isOnline").textContent).toBe("true");
  });
});
