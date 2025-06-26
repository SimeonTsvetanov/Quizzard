# 📘 QUIZZARD DEVELOPMENT STANDARDS

**Version:** 1.0
**Last Updated:** June 26, 2025
**Status:** DRAFT - Under Reorganization

## 1.0 App Overview

Quizzard is a Progressive Web App (PWA) built with React and TypeScript, utilizing Material-UI for its user interface. It provides tools for creating, managing, and playing quizzes, including a random team generator, a points counter, and an AI-powered question generator. It features robust cloud synchronization with Google Drive and PWA capabilities for offline use and installability.

## 2.0 Core Technologies & Implementation

- **Frontend:** React, TypeScript, Material-UI (MUI), React Router DOM, Vite.
- **State Management:** React hooks (`useState`, custom hooks), `localStorage` (for persistence), `IndexedDB` (for quiz data persistence).
- **Authentication:** Google OAuth (`@react-oauth/google`) for user authentication and Google Drive/Slides API integration.
- **PWA:** Service Worker for offline capabilities, caching, and installability.
- **Testing:** Jest for unit and component testing.
- **Build Tool:** Vite.
- **AI Integration:** Google Gemini API.
- **Presentation:** `reveal.js` (for Google Slides export).

## 3.0 Architectural Principles

- **Feature-Based Modularity:** Code organized into distinct features (`src/features/`), pages (`src/pages/`), and shared resources (`src/shared/`).
- **Mobile-First & Responsive Design:** UI adapts seamlessly across all device sizes (320px to 7680px).
- **PWA-First Design:** Prioritizes offline functionality, installability, and a native app-like experience.
- **Local-First Data:** `IndexedDB` is the single source of truth for the UI; Google Drive serves as a background sync/backup.
- **Component-Based Architecture:** Small, reusable components following the Single Responsibility Principle.
- **Theming:** Supports light and dark themes with persistence.
- **Robustness:** Emphasis on error handling, conflict resolution, and data migration.

## 4.0 Coding Standards

- **Code Quality:** Write self-documenting code, prefer readability, follow established patterns.
- **TypeScript:** Strict typing, no `any` types, use interfaces for props.
- **React:** Functional components only, use hooks for state, custom hooks for reusable logic.
- **File Naming:** PascalCase for components (`MyComponent.tsx`), camelCase for utilities (`myUtility.ts`), kebab-case for assets (`my-asset.png`).

## 5.0 UI/UX Guidelines

- **Material Design:** Adhere strictly to Google Material Design principles (MUI components, color palette, typography).
- **Responsive Design:** Use `clamp()` for fluid scaling of typography, spacing, and elements.
- **Accessibility:** Implement ARIA labels, ensure keyboard navigation, maintain WCAG AA color contrast.
- **Header/Footer:** Consistent height, sticky positioning, dynamic header text based on route.
- **Buttons:** Consistent sizing, responsive text strategy (icon-only on mobile), proper disabled/loading states.
- **Modals/Drawers:** Subtle blur backdrop for focus effect.

## 6.0 Testing Standards & Requirements

- **Testing Framework:** Jest with ts-jest for TypeScript support.
- **Test Structure:** Feature-based organization with `__tests__/` folders in each feature directory.
- **Test Categories:** Unit tests (functions/services), Hook tests (React hooks), Component tests (UI), Integration tests (flows).
- **Coverage Requirements:** 90%+ coverage for all new code, 99%+ test pass rate.
- **Test-First Development:** Write tests before or alongside implementation for all new features.
- **Documentation:** All test files must be documented in `docs/planning/00-others/testing-plan.md`.
- **Naming Conventions:** `{functionName}.test.ts` for unit tests, `{ComponentName}.test.tsx` for components.
- **Mock Strategy:** Mock external dependencies (Google OAuth, IndexedDB, localStorage) for isolated testing.
- **Test Maintenance:** Update tests when changing functionality, remove obsolete tests, refactor for clarity.

### 6.1 Testing Workflow for New Features

1. **Plan Tests First:** Identify test categories needed, create test files in appropriate `__tests__/` folders.
2. **Write Test Descriptions:** Document what should be tested before implementing code.
3. **Update Testing Plan:** Add new test files to `docs/planning/00-others/testing-plan.md`.
4. **Implement Tests:** Follow established patterns, mock dependencies, test success and failure scenarios.
5. **Verify Coverage:** Ensure 90%+ coverage for new code, all tests pass.
6. **Document Patterns:** Update testing plan with any new patterns discovered.

### 6.2 Testing Checklist for New Features

**Required for All New Features:**

- [ ] Unit tests for all new functions/services
- [ ] Hook tests for all new custom hooks
- [ ] Integration tests for complete user flows
- [ ] Error handling tests for failure scenarios
- [ ] Backward compatibility tests (if applicable)

**Required for UI Changes:**

- [ ] Component tests for new UI components
- [ ] Accessibility tests for new components
- [ ] Responsive design tests (if mobile-specific)

**Required for Authentication Features:**

- [ ] Token storage/retrieval tests
- [ ] Token refresh tests
- [ ] Offline handling tests
- [ ] Error recovery tests
- [ ] Security-related tests

### 6.3 Testing Best Practices

- **Test Organization:** Use nested `describe` blocks for logical grouping.
- **Test Naming:** Clear, descriptive test names that explain expected behavior.
- **Mock Strategy:** Mock external dependencies, use consistent test data.
- **Test Data:** Use consistent mock objects for tokens, users, and other data.
- **Error Scenarios:** Always test both success and failure paths.
- **Performance:** Keep test suite under 30 seconds for full execution.

**Reference:** For complete testing strategy and structure, see `docs/planning/00-others/testing-plan.md`.

## 7.0 Deployment Overview

- **Platform:** GitHub Pages.
- **Automation:** Automated deployment via GitHub Actions on pushes to `main` branch.
- **Base Path:** Configured for `/Quizzard/` base path.
- **Builds:** Only production builds are deployed; `main` branch contains source code only.

## 8.0 Critical Lessons Learned - CATASTROPHIC MISTAKES TO NEVER REPEAT

These are real mistakes made during development that broke the entire application. These patterns must NEVER be repeated.

### 8.1 Configuration Errors

- **Base Path Configuration:**
  - ❌ **CATASTROPHIC ERROR:** Changing `vite.config.ts` from working conditional logic to hardcoded path (e.g., `base: "/Quizzard/"`). This breaks the development environment.
  - ✅ **CORRECT:** Preserve `base: process.env.NODE_ENV === "production" ? "/Quizzard/" : "/";`. This is CRITICAL for GitHub Pages deployment.
- **TypeScript Configuration:**
  - ❌ **CATASTROPHIC ERROR:** Using invalid TypeScript compiler options (e.g., `"erasableSyntaxOnly": true`). This causes build failures.
  - ✅ **CORRECT:** Always verify TypeScript compiler options exist and are valid.

### 8.2 Codebase Integrity

- **Circular Dependencies:**
  - ❌ **CATASTROPHIC ERROR:** Creating circular imports (e.g., `SnackbarProvider.tsx` imports `useSnackbar.ts` which tries to use context from `SnackbarProvider.tsx`).
  - ✅ **NEVER CREATE:** Provider components that import their own hooks. Always verify import chains.
- **Breaking Shared Utilities:**
  - ❌ **CATASTROPHIC ERROR:** Modifying working shared utilities (e.g., `useSnackbar.ts`) without understanding all dependencies.
  - ✅ **RULE:** Never modify working shared utilities unless explicitly requested and after understanding ALL dependencies. If it works, don't "improve" it unless necessary.
- **Breaking Working UI Components:**
  - ❌ **CATASTROPHIC ERROR:** Modifying UI components that are working perfectly (e.g., header layout, logo image).
  - ✅ **RULE:** Never modify UI components unless explicitly requested. Always verify what's working before making changes.
- **Incorrect File Extensions with JSX:**
  - ❌ **CATASTROPHIC ERROR:** Creating `.ts` files with JSX content.
  - ✅ **RULE:** Any file with JSX/React components MUST use `.tsx` extension. Only pure TypeScript (no JSX) should use `.ts`.

### 8.3 Git Usage & Workflow

- **Ignoring Revert Instructions:**
  - ❌ **CATASTROPHIC ERROR:** User requests a revert, but the AI tries to "fix" things forward, leading to cascading failures.
  - ✅ **RULE:** When user says REVERT, immediately stop and revert (`git reset --hard commit_hash` or manual restoration). Don't try to fix forward.
- **Improper Git Usage:**
  - ❌ **CATASTROPHIC ERROR:** Failing to use `git reset --hard` or manual file restoration when needed.
  - ✅ **RULE:** Learn git revert patterns. Always have a clean working state before modifications.
- **Not Preserving Working Baseline:**
  - ❌ **CATASTROPHIC ERROR:** Starting modifications without a complete understanding of the working commit.
  - ✅ **RULE:** Never start modifications without a complete working baseline. Document exactly what works before ANY changes.

### 8.4 AI Interaction & Problem Solving

- **Cascading Fixes Spiral:**
  - ❌ **CATASTROPHIC PATTERN:** Fix 1 creates Problem A, Fix 2 creates Problem B, etc., leading to total system breakdown.
  - ✅ **CORRECT PATTERN:** Problem → Analyze → Understand → Single targeted fix. If fix fails, STOP and revert immediately.
- **Authentication Complexity Without Understanding:**
  - ❌ **CATASTROPHIC ERROR:** Adding major features (e.g., Google authentication) without understanding existing architecture.
  - ✅ **RULE:** Understand current architecture completely before adding major features. Start with minimal implementation.

### 8.5 Testing & Module Compatibility

- **Jest Configuration Module Compatibility Errors:**
  - ❌ **CATASTROPHIC ERROR:** Using wrong file extensions and import syntax (e.g., `jest.config.js` with ES6 import in `jest.setup.js`, `.js` for CommonJS files in ES module projects).
  - ✅ **CORRECT PATTERN:** For projects with `"type": "module"` in `package.json`, use `jest.config.cjs`, `jest.setup.js` with `require()`, and `mocks/*.cjs`. Test files (`.test.ts`, `.test.tsx`) can use ES6 import.
  - ✅ **RULE:** Always check `package.json "type"` field. Use `.cjs` for CommonJS files in ES module projects. Use `require()` not `import()` in Jest setup files for CommonJS compatibility.

## 9.0 Prevention Protocols

### 9.1 Before Making ANY Changes:

1.  **✅ VERIFY:** Development server runs on `localhost:5173`.
2.  **✅ VERIFY:** All features work exactly as expected.
3.  **✅ VERIFY:** No console errors or warnings.
4.  **✅ DOCUMENT:** Exact working state before modifications.
5.  **✅ COMMIT:** Clean working state to git.

### 9.2 During Implementation:

1.  **✅ ONE CHANGE:** Make one small change at a time.
2.  **✅ TEST IMMEDIATELY:** Verify it works before proceeding.
3.  **✅ NO "IMPROVEMENTS":** Only modify what's explicitly requested.
4.  **✅ ASK CLARIFICATION:** If anything is unclear, ask instead of assume.

### 9.3 If Problems Arise:

1.  **✅ STOP IMMEDIATELY:** Don't try multiple fixes.
2.  **✅ REVERT FAST:** Go back to working state immediately.
3.  **✅ UNDERSTAND ROOT CAUSE:** Analyze what went wrong before trying again.
4.  **✅ ASK FOR HELP:** Better to ask than break more things.

## 10.0 How-To's (Concise)

- **Adding a New Route:** Define in `src/App.tsx` using `React.lazy()` and `Suspense`.
- **Using Local Storage:** Use `useLocalStoragePersistence` hook with `STORAGE_KEYS` from `src/shared/utils/storageKeys.ts`.
- **Implementing a New Feature:** Create a new folder under `src/features/` with its own `pages/`, `components/`, `hooks/`, `utils/`, and `types/` subdirectories.
- **Updating Theme:** Modify `src/theme.ts` and use MUI's `ThemeProvider`.
- **Running Tests:** Use `npm test` or `npm test:watch`.
- **Building for Production:** Use `npm run build`.
- **Deploying to GitHub Pages:** Push to `main` branch; GitHub Actions handles the rest.
- **Writing Tests:** Follow `docs/planning/00-others/testing-plan.md` for structure and patterns.
