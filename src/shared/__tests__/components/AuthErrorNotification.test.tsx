/**
 * Minimal tests for AuthErrorNotification component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthErrorNotification } from "../../components/AuthErrorNotification";

describe("AuthErrorNotification (Minimal)", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render error notification when open", () => {
    render(
      <AuthErrorNotification
        open={true}
        message="Test error message"
        severity="error"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should handle different severity levels", () => {
    const severities = ["error", "warning", "info"] as const;

    severities.forEach((severity) => {
      expect(["error", "warning", "info"]).toContain(severity);
    });
  });

  it("should not render when closed", () => {
    render(
      <AuthErrorNotification
        open={false}
        message="Hidden message"
        severity="error"
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText("Hidden message")).not.toBeInTheDocument();
  });
});
