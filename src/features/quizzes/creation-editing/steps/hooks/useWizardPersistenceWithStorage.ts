import React from "react";

// Add a deletedRef to track if the quiz has been deleted externally
const deletedRef = React.useRef(false);

// Listen for 'QUIZ_DELETED' events and set deletedRef
React.useEffect(() => {
  const bc = new window.BroadcastChannel("quizzard-quiz-events");
  const handler = (event: MessageEvent) => {
    if (
      event.data?.type === "QUIZ_DELETED" &&
      event.data.id === draftQuiz?.id
    ) {
      deletedRef.current = true;
    }
  };
  bc.addEventListener("message", handler);
  return () => {
    bc.removeEventListener("message", handler);
    bc.close();
  };
}, [draftQuiz?.id]);

// Enhanced auto-save: do not save if deleted
const autoSaveDraft = React.useCallback(
  async () => {
    if (deletedRef.current) return; // Prevent auto-save if deleted
    // ... existing auto-save logic ...
  },
  [
    /* existing deps */
  ]
);

// Enhanced updateDraft: do not save if deleted
const updateDraftIfNotDeleted = React.useCallback(
  async (draft) => {
    if (deletedRef.current) return; // Prevent update if deleted
    await updateDraft(draft);
  },
  [updateDraft]
);
