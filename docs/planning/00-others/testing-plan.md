# TESTING STRATEGY & STRUCTURE PLAN

## 🎯 WHY WE NEED THIS TESTING PLAN

As Quizzard grows from 3 tests to potentially 200-300 tests, we need a structured approach to:

- **Maintain test quality** and consistency
- **Ensure proper coverage** for all new features
- **Make tests discoverable** and maintainable
- **Support parallel execution** for faster test runs
- **Prevent test conflicts** and dependencies

This plan establishes our testing standards and structure for all future development.

---

## 📁 RECOMMENDED TESTING STRUCTURE

### **Feature-Based Organization (RECOMMENDED)**

```
src/
├── features/
│   ├── random-team-generator/
│   │   └── __tests__/
│   │       ├── utils/
│   │       │   └── teamGenerator.test.ts ✅ (EXISTING)
│   │       ├── hooks/
│   │       │   └── useParticipants.test.ts
│   │       └── components/
│   │           └── TeamsModal.test.tsx
│   ├── points-counter/
│   │   └── __tests__/
│   │       ├── hooks/
│   │       │   └── useGameActions.test.ts
│   │       └── components/
│   │           └── GameScreen.test.tsx
│   └── quizzes/
│       └── __tests__/
│           ├── services/
│           │   └── indexedDBService.test.ts
│           ├── hooks/
│           │   └── useQuizManagement.test.ts
│           └── components/
│               └── QuizWizardModal.test.tsx
├── shared/
│   └── __tests__/
│       ├── services/
│       │   ├── authStorage.test.ts
│       │   └── tokenRefresh.test.ts
│       ├── hooks/
│       │   └── useGoogleAuth.test.ts
│       ├── components/
│       │   └── ProfileSelectionModal.test.tsx
│       └── integration/
│           └── auth-flow.test.ts
└── __tests__/ (ROOT LEVEL - FOR APP-WIDE TESTS)
    ├── setup/
    │   └── test-utils.ts
    ├── mocks/
    │   ├── indexedDB.mock.ts
    │   ├── localStorage.mock.ts
    │   └── google-oauth.mock.ts
    └── integration/
        └── app-flow.test.ts
```

---

## 🧪 TEST CATEGORIES & NAMING CONVENTIONS

### **1. Unit Tests (Individual Functions)**

**Location:** `__tests__/utils/` or `__tests__/services/`
**Naming:** `{functionName}.test.ts`
**Purpose:** Test individual functions, utilities, and services

```typescript
// src/shared/__tests__/services/authStorage.test.ts
describe("AuthStorage", () => {
  describe("saveToken", () => {
    it("should save token to IndexedDB successfully");
    it("should fallback to localStorage if IndexedDB fails");
    it("should handle storage quota exceeded error");
  });
});
```

### **2. Hook Tests (React Hooks)**

**Location:** `__tests__/hooks/`
**Naming:** `{hookName}.test.ts`
**Purpose:** Test custom React hooks

```typescript
// src/shared/__tests__/hooks/useGoogleAuth.test.ts
describe("useGoogleAuth", () => {
  it("should maintain existing interface unchanged");
  it("should use new storage service for tokens");
  it("should handle token refresh transparently");
});
```

### **3. Component Tests (UI Components)**

**Location:** `__tests__/components/`
**Naming:** `{ComponentName}.test.tsx`
**Purpose:** Test React components (only new functionality)

```typescript
// src/shared/__tests__/components/ProfileSelectionModal.test.tsx
describe("ProfileSelectionModal", () => {
  it("should render without visual changes");
  it("should handle Google login selection");
  it("should maintain existing UI behavior");
});
```

### **4. Integration Tests (Full Flows)**

**Location:** `__tests__/integration/`
**Naming:** `{feature}-flow.test.ts`
**Purpose:** Test complete user flows and feature interactions

```typescript
// src/shared/__tests__/integration/auth-flow.test.ts
describe("Authentication Flow", () => {
  it("should complete full login flow end-to-end");
  it("should handle token refresh during active session");
  it("should gracefully handle offline scenarios");
});
```

---

## 📋 HOW TO USE THIS TESTING PLAN

### **For Each New Feature Implementation:**

#### **Step 1: Plan Tests First**

1. **Identify test categories** needed for the feature
2. **Create test files** in appropriate `__tests__/` folders
3. **Write test descriptions** before implementing code
4. **Update this plan** with new test files

#### **Step 2: Implement Tests**

1. **Follow naming conventions** exactly
2. **Use established patterns** from existing tests
3. **Mock external dependencies** properly
4. **Test both success and failure scenarios**

#### **Step 3: Update Documentation**

1. **Add new test files** to this plan
2. **Update coverage targets** if needed
3. **Document any new testing patterns**

### **Example Workflow for Google Auth Enhancement:**

#### **Phase 1: Storage Migration**

```typescript
// 1. Create test file
src/shared/__tests__/services/authStorage.test.ts

// 2. Add to this plan
- [ ] src/shared/__tests__/services/authStorage.test.ts

// 3. Implement tests
describe('AuthStorage', () => {
  // Test IndexedDB operations
  // Test localStorage fallback
  // Test migration logic
})

// 4. Update this plan
✅ src/shared/__tests__/services/authStorage.test.ts
```

---

## 🎯 TEST COVERAGE TARGETS

### **Unit Tests: 90%+ Coverage**

- All new service functions
- All new utility functions
- All new hooks
- All new business logic

### **Integration Tests: Critical Paths**

- Complete authentication flows
- Storage migration scenarios
- Error handling paths
- Cross-feature interactions

### **Component Tests: New Features Only**

- Only test new authentication-related UI
- Preserve existing working components
- Focus on behavior, not implementation details

---

## 🛠️ TESTING BEST PRACTICES

### **1. Test Organization**

```typescript
describe("FeatureName", () => {
  describe("SubFeature", () => {
    describe("SpecificOperation", () => {
      it("should perform expected behavior");
      it("should handle error scenarios");
      it("should maintain backward compatibility");
    });
  });
});
```

### **2. Test Naming**

```typescript
// Clear, descriptive test names
it("should migrate token from localStorage to IndexedDB on first access");
it("should fallback to localStorage when IndexedDB is unavailable");
it("should maintain user session across browser restarts");
it("should handle Google OAuth configuration changes gracefully");
```

### **3. Mock Strategy**

```typescript
// Mock external dependencies
jest.mock("@react-oauth/google");
jest.mock("indexeddb"); // For IndexedDB operations
jest.mock("localStorage"); // For localStorage operations

// Mock browser APIs
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});
```

### **4. Test Data Management**

```typescript
// Use consistent test data
const mockToken = {
  access_token: "test-access-token",
  expires_in: 3600,
  timestamp: Date.now(),
};

const mockUser = {
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/avatar.jpg",
};
```

---

## 📊 TEST EXECUTION & MAINTENANCE

### **Running Tests**

```bash
# Run all tests
npm test

# Run tests for specific feature
npm test -- --testPathPattern=random-team-generator

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

### **Test Maintenance**

1. **Update tests** when changing functionality
2. **Remove obsolete tests** when removing features
3. **Refactor tests** when improving patterns
4. **Update this plan** when adding new test categories

---

## 🔄 INTEGRATION WITH DEVELOPMENT WORKFLOW

### **Before Implementing New Feature:**

1. **Create test files** in appropriate `__tests__/` folders
2. **Write test descriptions** (what should be tested)
3. **Update this plan** with new test files

### **During Implementation:**

1. **Write tests** before or alongside code
2. **Ensure tests pass** before committing
3. **Maintain test coverage** targets

### **After Implementation:**

1. **Update this plan** with completed tests
2. **Document any new patterns** discovered
3. **Review test coverage** and quality

---

## 📝 TESTING CHECKLIST FOR NEW FEATURES

### **Required for All New Features:**

- [ ] Unit tests for all new functions/services
- [ ] Hook tests for all new custom hooks
- [ ] Integration tests for complete user flows
- [ ] Error handling tests for failure scenarios
- [ ] Backward compatibility tests (if applicable)

### **Required for UI Changes:**

- [ ] Component tests for new UI components
- [ ] Visual regression tests (if significant UI changes)
- [ ] Accessibility tests for new components
- [ ] Responsive design tests (if mobile-specific)

### **Required for Authentication Features:**

- [ ] Token storage/retrieval tests
- [ ] Token refresh tests
- [ ] Offline handling tests
- [ ] Error recovery tests
- [ ] Security-related tests

---

## 🎯 SUCCESS METRICS

### **Quality Metrics:**

- **Test Coverage**: 90%+ for new code
- **Test Reliability**: 99%+ pass rate
- **Test Performance**: <30 seconds for full test suite
- **Test Maintainability**: Clear, readable test code

### **Process Metrics:**

- **Test-First Development**: 80%+ of features have tests before implementation
- **Documentation**: 100% of test files documented in this plan
- **Review Process**: All tests reviewed before merging

---

**This plan ensures consistent, maintainable, and comprehensive testing as Quizzard grows from 3 to 200+ tests.**

---

## 🗂️ UTILITY & MOCK FILES: BEST PRACTICES

### **Where to Place Utility and Mock Files**

- **Do NOT place utility or mock files in `__tests__` folders.**

  - Jest treats every file in a `__tests__` folder as a test suite and expects at least one `test`/`it` block.
  - This causes errors for files that are only helpers or mocks.

- **Recommended locations for utility/mock files:**
  - `src/test-utils/` — for shared test helpers, render functions, etc.
  - `src/mocks/` or `src/__mocks__/` — for mock implementations (e.g., IndexedDB, localStorage, API mocks)
  - `src/__setup__/` — for global test setup files (optional)

**Example Structure:**

```
src/
  features/
    my-feature/
      __tests__/
        myFeature.test.ts
  test-utils/
    test-utils.ts
  mocks/
    indexedDB.mock.ts
```

### **Why?**

- Keeps test runs clean and avoids Jest errors about missing tests.
- Makes it clear which files are actual test suites and which are helpers/mocks.
- Follows industry best practices for large codebases.

### **How to Use**

- **Import utility/mock files into your test files as needed:**
  ```ts
  import { renderWithProviders } from "../../test-utils/test-utils";
  import indexedDBMock from "../../mocks/indexedDB.mock";
  ```
- **Do NOT add `test` or `it` blocks to utility/mock files unless they are real tests.**
- **If you need to share setup logic, use a `setupTests.ts` or similar in `src/__setup__/` and reference it in your Jest config.**

### **Current File Locations**

- **Test Utilities:** `src/test-utils/test-utils.ts`
- **Mock Files:** `src/mocks/indexedDB.mock.ts`
- **Real Tests:** `src/features/*/__tests__/*.test.ts`
