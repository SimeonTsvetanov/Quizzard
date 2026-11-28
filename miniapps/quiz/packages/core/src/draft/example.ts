// The example every prompt shows the assistant (guide.ts) — and the quiz the tests make first.

/** A small quiz in the draft format: one round of every kind. */
export const DRAFT_EXAMPLE = {
  name: "Friday quiz",
  language: "en",
  teams: 4,
  rounds: [
    {
      type: "standard",
      name: "Warm-up",
      seconds: 30,
      points: 1,
      questions: [
        { q: "Which river flows through Paris?", a: "The Seine", explanation: "It splits around two islands in the city centre." },
        { q: "Which of these are planets?", options: ["Mars", "Europa", "Venus", "Titan"], correct: [1, 3] },
        { q: "What does the abbreviation WC stand for?", options: ["World Cup", "Water Closet", "Wash Corner", "West Coast"], correct: 2 },
        { q: "The Great Wall of China is visible from the Moon.", a: false },
        { q: "Name the band and the song.", a: "Queen — Bohemian Rhapsody", points: 2, pointsNote: "1 for the band, 1 for the song", seconds: 45 },
      ],
    },
    {
      type: "pyramid",
      name: "Golden pyramid",
      questions: [
        { q: "Name the largest planet.", accepted: ["Jupiter"] },
        { q: "Name 2 primary colours of light.", accepted: ["Red", "Green", "Blue"] },
        { q: "Name 3 noble gases.", accepted: ["Helium", "Neon", "Argon", "Krypton", "Xenon", "Radon"] },
        { q: "Name 4 oceans.", accepted: ["Pacific", "Atlantic", "Indian", "Arctic", "Southern"] },
      ],
    },
    {
      type: "safe",
      name: "Safe",
      bonus: 3,
      questions: [
        { q: "How many sides does a triangle have?", digit: 3 },
        { q: "How many strings does a violin have?", digit: 4 },
        { q: "How many rings are on the Olympic flag?", digit: 5 },
        { q: "How many legs does an insect have?", digit: 6 },
        { q: "How many colours are in a rainbow?", digit: 7 },
      ],
    },
    { type: "laugh", name: "Make the quizmaster laugh", seconds: 300, first: 3, second: 1 },
  ],
} as const;
