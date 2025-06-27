# TESTING STRATEGY & STRUCTURE PLAN

## 🎯 WHY WE NEED THIS TESTING PLAN

As Quizzard grows, we need a structured approach to:

- **Maintain test quality** and consistency
- **Ensure proper coverage** for all new features
- **Make tests discoverable** and maintainable
- **Support parallel execution** for faster test runs
- **Prevent test conflicts** and dependencies

**However, our philosophy is to keep the test suite minimal and focused on core functionality.**

---

## 📁 RECOMMENDED TESTING STRUCTURE (2025+)

- **Only write a small number of tests for each feature.**
- **Test only the core flows (e.g., login, logout, save, load, delete, refresh, error handling).**
- **Do NOT test every small feature or UI detail.**
- **Remove or avoid overcomplicated, excessive, or redundant tests.**
- **Keep each test file under 5-8 tests unless absolutely necessary.**

### Example Structure (Current):

```
src/
├── shared/
│   └── __tests__/
│       ├── services/
│       │   ├── authStorage.test.ts         # 5 tests (core save/load/delete/status/error)
│       │   └── tokenRefresh.test.ts        # 5-8 tests (core refresh flows)
│       ├── hooks/
│       │   ├── useGoogleAuth.test.ts       # 5 tests (login/logout/load/error/interface)
│       │   └── useNetworkStatus.test.tsx   # 3 tests (online/offline detection)
│       ├── components/
│       │   └── AuthErrorNotification.test.tsx # 3 tests (render, severity, closed)
│       └── utils/
│           └── errorHandling.test.ts       # 5 tests (core error handling)
```

---

## 🧪 TEST CATEGORIES & NAMING CONVENTIONS (MINIMAL)

- **Unit Tests:** Only for core service logic (save/load/delete, refresh, etc.)
- **Hook Tests:** Only for core hook interface and flows (login/logout, state, error)
- **Component Tests:** Only for new/critical UI, not every visual detail
- **Integration Tests:** Only for full critical flows (e.g., login/logout, migration)

---

## 📋 HOW TO USE THIS TESTING PLAN

### For Each New Feature Implementation:

1. **Identify the absolute minimum set of tests needed.**
2. **Write only 3-8 tests per file, focusing on core flows.**
3. **Do NOT add tests for every small feature, prop, or UI state.**
4. **Update this plan with new test files and keep it lean.**

### Example: Google Auth System (Current)

- `authStorage.test.ts`: 5 tests (save, load, delete, status, error)
- `useGoogleAuth.test.ts`: 5 tests (login, auto-login, logout, interface, error)
- `useNetworkStatus.test.tsx`: 3 tests (online, offline, back online)
- `tokenRefresh.test.ts`: 5-8 tests (refresh, error, retry, etc.)
- `AuthErrorNotification.test.tsx`: 3 tests (render, severity, closed)

---

## 🛠️ TESTING BEST PRACTICES (MINIMAL)

- **Test only what matters for reliability and user experience.**
- **Avoid over-testing or duplicating browser behavior.**
- **Prefer simple, readable tests over exhaustive coverage.**
- **Remove or refactor tests that are no longer relevant after code changes.**
- **If a feature is removed, delete its tests.**

---

## 📝 TESTING CHECKLIST FOR NEW FEATURES (MINIMAL)

- [ ] 3-8 core tests for each new feature (not more)
- [ ] Only test login/logout, save/load/delete, refresh, and error handling
- [ ] Do NOT test every prop, UI state, or edge case unless critical
- [ ] Remove obsolete or excessive tests
- [ ] Keep test files short and focused

---

## 🎯 SUCCESS METRICS

- **Test suite runs in under 30 seconds**
- **All tests pass reliably**
- **No more than 8 tests per file (unless justified)**
- **Tests are easy to read and maintain**

---

## 🆕 2025-06-27 Simplification Note

To keep the suite lean and fast, all test files were refactored to contain only essential scenarios (save, load, delete, status, login, logout, refresh, error):

- `src/shared/__tests__/services/authStorage.test.ts`
- `src/shared/__tests__/services/tokenRefresh.test.ts`
- `src/shared/__tests__/hooks/useGoogleAuth.test.ts`
- `src/shared/__tests__/hooks/useNetworkStatus.test.tsx`
- `src/shared/__tests__/components/AuthErrorNotification.test.tsx`
- `src/shared/__tests__/utils/errorHandling.test.ts`

Heavy quota, corruption, and concurrency cases were removed. This aligns with the project's preference for simpler, maintainable tests while still covering the critical paths.

---

**This plan ensures a lean, maintainable, and reliable test suite focused on core functionality.**
