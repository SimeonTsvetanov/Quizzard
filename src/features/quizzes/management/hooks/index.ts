/**
 * Management Hooks Index
 *
 * Exports all quiz management-related hooks including:
 * - useQuizzesPageStateWithStorage: Main page state management with IndexedDB
 * - useQuizzesPageState: Original page state management
 * - useQuizStorage: IndexedDB storage operations
 * - useQuizCRUD: Create, Read, Update, Delete operations
 * - useQuizManagement: General quiz management operations
 * - useQuizValidation: Quiz data validation
 *
 * @fileoverview Central export point for management hooks
 * @version 1.0.0
 */

// Main Page State Management
export { useQuizzesPageStateWithStorage } from "./useQuizzesPageStateWithStorage";
export { useQuizzesPageState } from "./useQuizzesPageState";

// Storage Management
export { useQuizStorage } from "./useQuizStorage";

// CRUD Operations
export { useQuizCRUD } from "./useQuizCRUD";

// Quiz Management
export { useQuizManagement } from "./useQuizManagement";

// Validation
export { useQuizValidation } from "./useQuizValidation";
