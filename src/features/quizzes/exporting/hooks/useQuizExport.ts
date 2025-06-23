/**
 * Quiz Export Hook
 *
 * Extracted from useQuizManagement for better separation of concerns.
 * Handles PowerPoint export functionality using PptxGenJS with comprehensive
 * slide generation, media support, and presenter notes.
 *
 * @fileoverview Quiz PowerPoint export hook following Single Responsibility Principle
 * @version 1.0.0
 * @since December 2025
 */

import { useState, useCallback } from "react";
import type { Quiz, ExportSettings } from "../types";

/**
 * Default export settings for PowerPoint generation
 */
const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  includePresenterNotes: true,
  slideTemplate: "standard",
  questionFontSize: 24,
  optionFontSize: 18,
  includeMetadata: true,
  includeAnswerKey: true,
  compressImages: true,
  imageQuality: 85,
};

/**
 * Validates quiz data before export
 *
 * @param quiz - Quiz to validate
 * @returns Error message if invalid, null if valid
 */
const validateQuizForExport = (quiz: Quiz | null): string | null => {
  if (!quiz) {
    return "Quiz data is missing";
  }
  if (!quiz.rounds || !Array.isArray(quiz.rounds)) {
    return "Quiz rounds are missing or invalid";
  }
  if (quiz.rounds.length === 0) {
    return "Quiz has no rounds";
  }
  if (!quiz.rounds.every((round) => round && Array.isArray(round.questions))) {
    return "One or more quiz rounds have invalid questions";
  }
  return null;
};

/**
 * Quiz Export Hook
 *
 * Provides PowerPoint export functionality including:
 * - PPTX generation with PptxGenJS
 * - Title slide with quiz metadata
 * - Individual question slides with answers
 * - Media file embedding for images
 * - Presenter notes with explanations
 * - Answer key slide generation
 *
 * @returns Object containing export functions and state
 */
export const useQuizExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  /**
   * Exports a quiz to PowerPoint format using PptxGenJS
   * Creates a downloadable PPTX file with all quiz content
   *
   * @param quiz - Quiz to export
   * @param settings - Export settings and preferences
   * @returns Promise that resolves when export is complete
   */
  const exportToPowerPoint = useCallback(
    async (
      quiz: Quiz,
      settings: ExportSettings = DEFAULT_EXPORT_SETTINGS
    ): Promise<void> => {
      setIsExporting(true);
      setExportError(null);

      try {
        // Validate quiz data before proceeding
        const validationError = validateQuizForExport(quiz);
        if (validationError) {
          throw new Error(validationError);
        }

        // Dynamic import to avoid bundling PptxGenJS unless needed
        const PptxGenJS = (await import("pptxgenjs")).default;
        const pptx = new PptxGenJS();

        // Configure presentation settings
        pptx.defineLayout({ name: "QUIZZARD", width: 10, height: 7.5 });
        pptx.layout = "QUIZZARD";

        // Add title slide if metadata is included
        if (settings.includeMetadata) {
          const titleSlide = pptx.addSlide();
          titleSlide.addText(quiz.title, {
            x: 1,
            y: 2,
            w: 8,
            h: 1.5,
            fontSize: 36,
            bold: true,
            align: "center",
          });

          titleSlide.addText(
            [
              {
                text: `Category: ${quiz.category}`,
                options: { breakLine: true },
              },
              {
                text: `Difficulty: ${quiz.difficulty}`,
                options: { breakLine: true },
              },
              {
                text: `Questions: ${
                  quiz.rounds.flatMap((r) => r.questions).length
                }`,
                options: { breakLine: true },
              },
            ],
            {
              x: 1,
              y: 4,
              w: 8,
              h: 2,
              fontSize: 18,
              align: "center",
            }
          );

          if (settings.includePresenterNotes) {
            titleSlide.addNotes(
              `Quiz: ${quiz.title}\nTotal Questions: ${
                quiz.rounds.flatMap((r) => r.questions).length
              }\nEstimated Duration: ${quiz.estimatedDuration} minutes`
            );
          }
        }

        // Add question slides
        quiz.rounds.forEach((round, roundIndex) => {
          // Add round title slide
          const roundSlide = pptx.addSlide();
          roundSlide.addText(
            `Round ${roundIndex + 1}${round.name ? `: ${round.name}` : ""}`,
            {
              x: 1,
              y: 2,
              w: 8,
              h: 1.5,
              fontSize: 32,
              bold: true,
              align: "center",
            }
          );

          if (round.description) {
            roundSlide.addText(round.description, {
              x: 1,
              y: 4,
              w: 8,
              h: 2,
              fontSize: 18,
              align: "center",
            });
          }

          // Add questions for this round
          round.questions.forEach((question, questionIndex) => {
            const slide = pptx.addSlide();
            const questionNumber = `Round ${roundIndex + 1}, Question ${
              questionIndex + 1
            }`;

            // Question title
            slide.addText(questionNumber, {
              x: 0.5,
              y: 0.5,
              w: 9,
              h: 0.8,
              fontSize: 28,
              bold: true,
              color: "1976D2",
            });

            // Question text
            slide.addText(question.question, {
              x: 0.5,
              y: 1.5,
              w: 9,
              h: 1.5,
              fontSize: settings.questionFontSize,
              bold: true,
            });

            // Handle different question types
            if (question.type === "single-answer") {
              slide.addText("Answer:", {
                x: 1,
                y: 3.5,
                w: 8,
                h: 0.7,
                fontSize: settings.optionFontSize,
                italic: true,
                color: "666666",
              });

              if (
                settings.includePresenterNotes &&
                question.correctAnswerText
              ) {
                slide.addNotes(
                  `${questionNumber}\nCorrect Answer: ${
                    question.correctAnswerText
                  }${
                    question.explanation
                      ? `\nExplanation: ${question.explanation}`
                      : ""
                  }`
                );
              }
            } else if (
              question.type === "multiple-choice" &&
              question.possibleAnswers
            ) {
              // Multiple choice questions
              question.possibleAnswers.forEach((answer, answerIndex) => {
                const optionLetter = String.fromCharCode(65 + answerIndex); // A, B, C, D...
                const isCorrect = question.correctAnswers.includes(answerIndex);

                slide.addText(`${optionLetter}. ${answer}`, {
                  x: 1,
                  y: 3.5 + answerIndex * 0.8,
                  w: 8,
                  h: 0.7,
                  fontSize: settings.optionFontSize,
                  bold: isCorrect,
                  color: isCorrect ? "4CAF50" : "000000",
                });
              });

              // Add presenter notes for multiple choice
              if (settings.includePresenterNotes) {
                const correctAnswers = question.correctAnswers
                  .map(
                    (index) =>
                      `${String.fromCharCode(65 + index)}. ${
                        question.possibleAnswers[index]
                      }`
                  )
                  .join(", ");

                let notes = `${questionNumber}\nCorrect Answer(s): ${correctAnswers}`;
                if (question.explanation) {
                  notes += `\nExplanation: ${question.explanation}`;
                }
                slide.addNotes(notes);
              }
            }

            // Add media if present
            if (question.mediaFile) {
              try {
                if (question.mediaFile.type === "image") {
                  slide.addImage({
                    data: question.mediaFile.data,
                    x: 6,
                    y: 3,
                    w: 3,
                    h: 2.5,
                    sizing: { type: "contain", w: 3, h: 2.5 },
                  });
                }
                // Note: Audio/video handling would require additional PptxGenJS configuration
              } catch (mediaError) {
                console.warn(
                  `Failed to add media for ${questionNumber}:`,
                  mediaError
                );
              }
            }
          });
        });

        // Add answer key slide if requested
        if (settings.includeAnswerKey) {
          const answerSlide = pptx.addSlide();
          answerSlide.addText("Answer Key", {
            x: 1,
            y: 1,
            w: 8,
            h: 1,
            fontSize: 32,
            bold: true,
            align: "center",
          });

          let answerText = "";
          quiz.rounds.forEach((round, roundIndex) => {
            answerText += `Round ${roundIndex + 1}:\n`;
            round.questions.forEach((question, questionIndex) => {
              const questionNumber = `Q${questionIndex + 1}`;
              if (question.type === "single-answer") {
                answerText += `${questionNumber}: ${question.correctAnswerText}\n`;
              } else if (question.type === "multiple-choice") {
                const correctAnswers = question.correctAnswers
                  .map((index) => String.fromCharCode(65 + index))
                  .join(", ");
                answerText += `${questionNumber}: ${correctAnswers}\n`;
              }
            });
            answerText += "\n";
          });

          answerSlide.addText(answerText.trim(), {
            x: 1,
            y: 2,
            w: 8,
            h: 4,
            fontSize: 16,
            align: "left",
          });
        }

        // Generate filename and save
        const filename = `${quiz.title.replace(/[^a-z0-9]/gi, "_")}_Quiz.pptx`;
        await pptx.writeFile({ fileName: filename });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to export quiz to PowerPoint";
        setExportError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  /**
   * Exports quiz data to JSON format for backup/sharing
   *
   * @param quiz - Quiz to export
   * @returns Promise resolving to downloaded JSON file
   */
  const exportToJSON = useCallback(async (quiz: Quiz): Promise<void> => {
    setIsExporting(true);
    setExportError(null);

    try {
      const jsonData = JSON.stringify(quiz, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${quiz.title.replace(/[^a-z0-9]/gi, "_")}_Quiz.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export quiz to JSON";
      setExportError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Clears any export errors
   */
  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  return {
    isExporting,
    exportError,
    exportToPowerPoint,
    exportToJSON,
    clearExportError,
    DEFAULT_EXPORT_SETTINGS,
  };
};
