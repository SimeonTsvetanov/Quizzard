/**
 * Quizzes Feature Type Definitions
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the Quizzes feature. Centralized type definitions ensure consistency
 * and maintainability across all components, hooks, and services.
 *
 * Updated for new round-based quiz system with media file support:
 * - IndexedDB storage for large files
 * - Round types determine question types
 * - Media file uploads (pictures, audio, video)
 * - Golden Pyramid special format
 * - Time/points as number inputs with decimal support
 * - Breaking time settings for rounds
 *
 * @fileoverview Type definitions for Quizzes feature
 * @version 2.0.0
 * @since December 2025
 */

/**
 * Supported media types for quiz questions
 */
export type MediaType = "image" | "audio" | "video";

/**
 * Quiz question type
 * - single-answer: Single correct answer (renamed from text-answer)
 * - multiple-choice: Multiple choice question with 1-20 possible answers
 * - picture: Picture-based question with file upload
 * - audio: Audio-based question with file upload
 * - video: Video-based question with file upload
 */
export type QuestionType =
  | "single-answer"
  | "multiple-choice"
  | "picture"
  | "audio"
  | "video";

/**
 * Supported round types for quiz creation
 * Round type determines available question types and UI behavior
 */
export type RoundType =
  | "mixed" // Mixed question types (user can select any type)
  | "single-answer-only" // Only single answer questions (renamed from text-only)
  | "multiple-choice" // Only multiple choice questions
  | "picture" // Only picture questions with image uploads
  | "audio" // Only audio questions with audio uploads
  | "video" // Only video questions with video uploads
  | "golden-pyramid"; // Special 4-question format

/**
 * Round answer reveal mode
 */
export type AnswerRevealMode = "after-each" | "after-all";

/**
 * Quiz difficulty levels for organization and filtering
 */
export type QuizDifficulty = "easy" | "medium" | "hard";

/**
 * Quiz categories for organization
 */
export type QuizCategory =
  | "general"
  | "sports"
  | "history"
  | "science"
  | "geography"
  | "entertainment"
  | "literature"
  | "art"
  | "music"
  | "technology"
  | "custom";

/**
 * Supported media file types for PowerPoint compatibility
 */
export interface SupportedMediaTypes {
  images: string[]; // ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg']
  audio: string[]; // ['mp3', 'wav', 'wma', 'm4a']
  video: string[]; // ['mp4', 'mov', 'wmv', 'avi']
}

/**
 * File size limits for different media types (in bytes)
 */
export interface FileSizeLimits {
  image: number; // 10MB max per image
  audio: number; // 20MB max per audio file
  video: number; // 100MB max per video file
  total: number; // 500MB max total quiz size
}

/**
 * Media file metadata for storage and display
 */
export interface MediaFile {
  /** Unique identifier for the media file */
  id: string;
  /** Original filename with extension */
  filename: string;
  /** File type (image/audio/video) */
  type: "image" | "audio" | "video";
  /** File size in bytes */
  size: number;
  /** Base64 encoded file data for storage */
  data: string;
  /** MIME type for proper handling */
  mimeType: string;
  /** Thumbnail for images/videos (base64) */
  thumbnail?: string;
  /** Duration for audio/video files in seconds */
  duration?: number;
  /** Upload timestamp */
  createdAt: Date;
}

/**
 * Quiz question interface (updated for new system)
 * Supports both manual creation and AI-generated questions in standard format
 */
export interface QuizQuestion {
  /** Unique identifier for the question */
  id: string;
  /** Question type determines UI and behavior */
  type: QuestionType;
  /** The main question text */
  question: string;
  /** Possible answers for multiple choice (1-20 answers), empty for single-answer */
  possibleAnswers: string[];
  /** Array of correct answer indices for Golden Pyramid (1,2,3,4 correct answers per question) */
  correctAnswers: number[];
  /** Single correct answer text for single-answer questions */
  correctAnswerText?: string;
  /** Optional explanation shown after answer */
  explanation?: string;
  /** Associated media file if any */
  mediaFile?: MediaFile;
  /** Question difficulty for organization */
  difficulty: QuizDifficulty;
  /** Points awarded for correct answer (decimal support) */
  points: number;
  /** Time limit in minutes (decimal support, e.g., 0.5 = 30 seconds) */
  timeLimit: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modified timestamp */
  updatedAt: Date;
}

/**
 * Round structure containing questions and round-level settings
 */
export interface Round {
  /** Unique identifier for the round */
  id: string;
  /** Display name for the round (e.g., "Round 1") */
  name: string;
  /** Optional round description */
  description?: string;
  /** Round type (determines question types allowed) */
  type: RoundType;
  /** Optional round level/difficulty label */
  level?: string;
  /** Answer reveal mode for this round */
  answerRevealMode: AnswerRevealMode;
  /** Default time per question in this round (in minutes, decimal support) */
  defaultTimePerQuestion: number;
  /** Breaking time between rounds in minutes (default 1) */
  breakingTime: number;
  /** For Golden Pyramid: time for entire round instead of per question */
  roundTimeLimit?: number;
  /** For Golden Pyramid: points for entire round instead of per question */
  roundPoints?: number;
  /** List of questions in this round */
  questions: QuizQuestion[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last modified timestamp */
  updatedAt: Date;
}

/**
 * Complete quiz structure containing all quiz data (updated for new system)
 */
export interface Quiz {
  /** Unique identifier for the quiz */
  id: string;
  /** Quiz title displayed to users */
  title: string;
  /** Optional quiz description */
  description?: string;
  /** Quiz category for organization */
  category: QuizCategory;
  /** Overall quiz difficulty */
  difficulty: QuizDifficulty;
  /** Quiz status for workflow management */
  status: "draft" | "completed";
  /** Array of all rounds in the quiz */
  rounds: Round[];
  /** Total estimated duration in minutes (calculated from questions + breaks) */
  estimatedDuration: number;
  /** Quiz creation timestamp */
  createdAt: Date;
  /** Last modified timestamp */
  updatedAt: Date;
  /** Quiz settings */
  settings: QuizSettings;
  /** Export metadata */
  exportData?: QuizExportData;
}

/**
 * Quiz settings
 */
export interface QuizSettings {
  /** Default time limit per question in minutes (decimal support) */
  defaultTimeLimit: number;
  /** Default points per question (decimal support) */
  defaultPoints: number;
  /** Default breaking time between rounds in minutes */
  defaultBreakingTime: number;
}

/**
 * Quiz export metadata
 */
export interface QuizExportData {
  /** Last export timestamp */
  lastExported: Date;
  /** Export format used */
  format: "google-slides" | "json";
  /** Export settings used */
  settings: ExportSettings;
  /** File size of last export in bytes */
  fileSize: number;
  /** Whether presenter notes were included */
  includePresenterNotes: boolean;
}

/**
 * Export settings for quiz export (Google Slides and JSON)
 */
export interface ExportSettings {
  /** Include quiz metadata (title, description, etc.) */
  includeMetadata: boolean;
  /** Include presenter notes and explanations */
  includePresenterNotes: boolean;
  /** Include answer key in export */
  includeAnswerKey: boolean;
  /** Font size for questions (Google Slides only) */
  questionFontSize: number;
  /** Font size for answer options (Google Slides only) */
  optionFontSize: number;
}

/**
 * Wizard step definition
 */
export interface WizardStep {
  /** Step identifier */
  id: string;
  /** Display title for the step */
  title: string;
  /** Step description */
  description: string;
  /** Whether this step is completed */
  completed: boolean;
  /** Whether this step is currently active */
  active: boolean;
  /** Whether this step is accessible */
  enabled: boolean;
}

/**
 * Quiz validation result
 */
export interface QuizValidation {
  /** Whether the quiz is valid for export/save */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
  /** Array of validation warning messages */
  warnings: string[];
  /** Validation timestamp */
  validatedAt: Date;
}

/**
 * Quizzes page component props
 */
export interface QuizzesPageProps {
  /** Optional initial quiz to load */
  initialQuiz?: Quiz;
}

/**
 * Quiz wizard component props
 */
export interface QuizWizardProps {
  /** Callback when quiz is successfully created */
  onQuizCreated: (quiz: Quiz) => void;
  /** Callback when wizard is cancelled */
  onCancel: () => void;
  /** Optional quiz to edit (for edit mode) */
  editQuiz?: Quiz;
}

/**
 * Question editor component props
 */
export interface QuestionEditorProps {
  /** Current question being edited */
  question: QuizQuestion;
  /** Callback when question is updated */
  onQuestionUpdate: (question: QuizQuestion) => void;
  /** Callback when question is deleted */
  onQuestionDelete: (questionId: string) => void;
  /** Index of question in the round */
  questionIndex: number;
  /** Total number of questions in round */
  totalQuestions: number;
  /** Round type to determine UI behavior */
  roundType: RoundType;
}

/**
 * Media upload component props
 */
export interface MediaUploadProps {
  /** Accepted file types */
  acceptedTypes: string[];
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Callback when file is uploaded */
  onFileUpload: (file: MediaFile) => void;
  /** Callback when upload fails */
  onUploadError: (error: string) => void;
  /** Current uploaded file (if any) */
  currentFile?: MediaFile;
  /** File type being uploaded */
  fileType: "image" | "audio" | "video";
}

/**
 * Export options component props
 */
export interface ExportOptionsProps {
  /** Quiz to export */
  quiz: Quiz;
  /** Export settings */
  settings: ExportSettings;
  /** Callback when settings change */
  onSettingsChange: (settings: ExportSettings) => void;
  /** Callback to start export */
  onStartExport: () => void;
  /** Whether export is in progress */
  isExporting: boolean;
}

/**
 * Quiz management hook return type
 */
export interface UseQuizManagementReturn {
  /** Array of all saved quizzes */
  quizzes: Quiz[];
  /** Currently selected/active quiz */
  currentQuiz: Quiz | null;
  /** Whether quizzes are being loaded */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Create a new quiz */
  createQuiz: (
    quizData: Omit<Quiz, "id" | "createdAt" | "updatedAt">
  ) => Promise<Quiz>;
  /** Update an existing quiz */
  updateQuiz: (id: string, updates: Partial<Quiz>) => Promise<Quiz>;
  /** Delete a quiz */
  deleteQuiz: (id: string) => Promise<void>;
  /** Load a specific quiz */
  loadQuiz: (id: string) => Promise<Quiz | null>;
  /** Clear current quiz */
  clearCurrentQuiz: () => void;
  /** Export quiz in supported formats */
  exportQuiz: (
    quizId: string,
    format: "google-slides" | "json",
    settings?: ExportSettings
  ) => Promise<void>;
  /** Set quizzes */
  setQuizzes: React.Dispatch<React.SetStateAction<Quiz[]>>;
}

/**
 * Quiz wizard hook return type
 */
export interface UseQuizWizardReturn {
  /** Current wizard step */
  currentStep: number;
  /** Array of all wizard steps */
  steps: WizardStep[];
  /** Draft quiz being created */
  draftQuiz: Partial<Quiz>;
  /** Whether wizard can proceed to next step */
  canProceed: boolean;
  /** Move to next step */
  nextStep: () => void;
  /** Move to previous step */
  previousStep: () => void;
  /** Jump to specific step */
  goToStep: (stepIndex: number) => void;
  /** Update draft quiz data */
  updateDraft: (updates: Partial<Quiz>) => void;
  /** Validate current step */
  validateStep: () => QuizValidation;
  /** Save draft quiz */
  saveDraft: () => Promise<void>;
  /** Complete wizard and create quiz */
  completeWizard: () => Promise<Quiz>;
  /** Reset wizard to beginning */
  resetWizard: () => void;
}

/**
 * File size limits constants
 */
export const FILE_SIZE_LIMITS: FileSizeLimits = {
  image: 10 * 1024 * 1024, // 10MB
  audio: 20 * 1024 * 1024, // 20MB
  video: 100 * 1024 * 1024, // 100MB
  total: 500 * 1024 * 1024, // 500MB
};

/**
 * Quiz validation constants
 */
export const QUIZ_CONSTANTS = {
  MAX_TITLE_LENGTH: 100,
  MIN_ROUNDS: 1,
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 100,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 20,
  FILE_SIZE_LIMITS: FILE_SIZE_LIMITS,
} as const;

/**
 * Supported file formats for PowerPoint compatibility
 */
export const SUPPORTED_MEDIA_TYPES: SupportedMediaTypes = {
  images: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "svg"],
  audio: ["mp3", "wav", "wma", "m4a"],
  video: ["mp4", "mov", "wmv", "avi"],
};

/**
 * Round type configurations
 */
export const ROUND_TYPE_CONFIG = {
  mixed: {
    label: "Any Type of Question",
    description: "Questions of any type",
    allowedQuestionTypes: [
      "single-answer",
      "multiple-choice",
      "picture",
      "audio",
      "video",
    ] as QuestionType[],
    canSelectQuestionType: true,
  },
  "single-answer-only": {
    label: "Question-Answer",
    description: "Only single answer questions",
    allowedQuestionTypes: ["single-answer"] as QuestionType[],
    canSelectQuestionType: false,
  },
  "multiple-choice": {
    label: "Multiple Choice Question",
    description: "Only multiple choice questions",
    allowedQuestionTypes: ["multiple-choice"] as QuestionType[],
    canSelectQuestionType: false,
  },
  picture: {
    label: "Picture Question",
    description: "Questions with picture uploads",
    allowedQuestionTypes: ["picture"] as QuestionType[],
    canSelectQuestionType: false,
  },
  audio: {
    label: "Audio Question",
    description: "Questions with audio uploads",
    allowedQuestionTypes: ["audio"] as QuestionType[],
    canSelectQuestionType: false,
  },
  video: {
    label: "Video Question",
    description: "Questions with video uploads",
    allowedQuestionTypes: ["video"] as QuestionType[],
    canSelectQuestionType: false,
  },
  "golden-pyramid": {
    label: "Golden Pyramid Question",
    description: "Special 4-question format",
    allowedQuestionTypes: ["multiple-choice"] as QuestionType[],
    canSelectQuestionType: false,
    specialFormat: true,
    prePopulatedQuestions: 4,
  },
} as const;
