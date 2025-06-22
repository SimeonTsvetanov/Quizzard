/**
 * Quizzes Feature Main Export
 *
 * This file serves as the main entry point for the Quizzes feature,
 * providing centralized exports for all feature components, hooks, and types.
 *
 * Exports:
 * - Main page component: Quizzes
 * - Components: QuizWizardModal and wizard step components
 * - Hooks: useQuizManagement, useQuizWizard
 * - Types: All TypeScript interfaces and types
 *
 * Usage:
 * import { Quizzes, useQuizManagement, QuizWizardModal } from './features/quizzes';
 *
 * @fileoverview Main export for Quizzes feature
 * @version 1.0.0
 * @since December 2025
 */

// Main page component
export { Quizzes } from "./pages/Quizzes";

// Components
export * from "./components";

// Hooks
export * from "./hooks";

// Types
export * from "./types";
