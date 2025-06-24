/**
 * roundInfoContent.ts
 *
 * Maps each round type to a user-friendly description for the info modal.
 * Text is written for non-technical users (children and adults alike).
 *
 * @version 1.0.0
 * @since 2025-06-12
 */

export type RoundType =
  | "mixed"
  | "single-answer"
  | "multiple-choice"
  | "picture"
  | "audio"
  | "video"
  | "golden-pyramid";

/**
 * User-friendly info text for each round type.
 */
export const roundInfoContent: Record<RoundType, string> = {
  mixed:
    "Mixed Types: This round can have any kind of question—multiple choice, single answer, pictures, audio, or video. Great for variety!",
  "single-answer":
    "Single Answer Only: Every question in this round has just one correct answer. Type your answer in the box. No tricky choices—just what you know!",
  "multiple-choice":
    "Multiple Choice: Each question gives you a few possible answers. Pick the one you think is right. Only one answer is correct for each question.",
  picture:
    "Picture Round: Every question shows a picture. You might have to name what's in the picture, answer a question about it, or pick from choices. Look closely!",
  audio:
    "Audio Round: Listen to a sound or a short clip, then answer the question. You might have to name a song, a person, or guess what's happening.",
  video:
    "Video Round: Watch a short video, then answer a question about what you saw or heard. Pay attention to details!",
  "golden-pyramid":
    "Golden Pyramid: This special round has 4 steps. Each step is a question with only one correct answer. If you get a question right, you move up to the next step. The questions get harder as you go, and you can win more points the higher you climb!",
};
