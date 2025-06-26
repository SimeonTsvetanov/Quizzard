/**
 * Test Utilities for Quizzard Application
 *
 * Common testing helpers, mock data, and utilities used across all tests.
 * This file provides consistent testing patterns and data for the entire application.
 *
 * @fileoverview Test utilities and helpers
 * @version 1.0.0
 * @since December 2025
 */

import { render, RenderOptions } from "@testing-library/react";
import React, { ReactElement } from "react";

/**
 * Mock Google OAuth Token Response
 */
export const mockTokenResponse = {
  access_token: "test-access-token-12345",
  expires_in: 3600,
  token_type: "Bearer",
  scope:
    "email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/presentations",
  timestamp: Date.now(),
};

/**
 * Mock Google User Profile
 */
export const mockUserProfile = {
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/avatar.jpg",
  email_verified: true,
  locale: "en",
};

/**
 * Mock Quiz Data for Testing
 */
export const mockQuiz = {
  id: "test-quiz-1",
  title: "Test Quiz",
  description: "A test quiz for testing purposes",
  category: "general" as const,
  difficulty: "medium" as const,
  status: "completed" as const,
  rounds: [],
  estimatedDuration: 30,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  settings: {
    defaultTimeLimit: 1,
    defaultPoints: 10,
    defaultBreakingTime: 1,
  },
};

/**
 * Mock LocalStorage for Testing
 */
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
};

/**
 * Mock IndexedDB for Testing
 */
export const createMockIndexedDB = () => {
  const store: Record<string, any> = {};

  return {
    open: jest.fn().mockResolvedValue({
      result: {
        createObjectStore: jest.fn(),
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(store),
            put: jest.fn().mockImplementation((data) => {
              store[data.id || "default"] = data;
              return Promise.resolve();
            }),
            delete: jest.fn().mockImplementation((key) => {
              delete store[key];
              return Promise.resolve();
            }),
            clear: jest.fn().mockImplementation(() => {
              Object.keys(store).forEach((key) => delete store[key]);
              return Promise.resolve();
            }),
          }),
        }),
      },
    }),
  };
};

/**
 * Custom Render Function with Providers
 *
 * Wraps components with necessary providers for testing
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

/**
 * Test Environment Setup
 */
export const setupTestEnvironment = () => {
  // Mock localStorage
  Object.defineProperty(window, "localStorage", {
    value: createMockLocalStorage(),
    writable: true,
  });

  // Mock IndexedDB
  Object.defineProperty(window, "indexedDB", {
    value: createMockIndexedDB(),
    writable: true,
  });

  // Mock Google OAuth
  jest.mock("@react-oauth/google", () => ({
    useGoogleLogin: jest.fn(),
    googleLogout: jest.fn(),
    GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }));
};

/**
 * Cleanup Test Environment
 */
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks();
  jest.resetModules();
};

/**
 * Wait for Async Operations
 */
export const waitForAsync = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Test Data Generators
 */
export const generateTestData = {
  participants: (count: number) =>
    Array.from({ length: count }, (_, i) => `Participant ${i + 1}`),

  teams: (teamCount: number, participantCount: number) => {
    const participants = generateTestData.participants(participantCount);
    const teams = Array.from({ length: teamCount }, () => []);

    participants.forEach((participant, index) => {
      teams[index % teamCount].push(participant);
    });

    return teams;
  },

  quiz: (overrides: Partial<typeof mockQuiz> = {}) => ({
    ...mockQuiz,
    ...overrides,
  }),
};

// Re-export everything from testing library
export * from "@testing-library/react";
export { customRender as render };
