// The Scores screen's Help in English (contract `HelpSection`): quick-start steps with the exact UI labels,
// every feature and the FAQ. One module per language, so a host bundles only the languages it uses (the
// standalone site's first load carries English only; Bulgarian goes into its language chunk).
import type { HelpSection } from "../contract.ts";

/** Quick-start steps with the exact English UI labels. */
export const stepsEn: readonly string[] = [
  "Type a player's name and tap Add. Repeat for everyone at the table, up to 50 players.",
  "Tap + or − on a player's card to change that score by one point.",
  "Tap the score itself to add or subtract any amount, for example 12 or −12, then tap Apply.",
  "Check the Leaderboard card: players are ranked by score, with 🥇 🥈 🥉 for the top three.",
  "Tap Share to send the leaderboard as text, or Reset scores to play again with the same players.",
];

/** The features' names, as the standalone site lists them. */
export const featureNamesEn = [
  "Up to 50 players per game",
  "+1 / −1 buttons and custom score changes",
  "Leaderboard ranked by score",
  "Share the leaderboard as text",
  "Works offline after the first visit",
  "Game saved on the device only",
] as const;

/** One sentence per feature, for Quizzard's Help (the standalone site shows the names only). */
const FEATURE_TEXTS: Readonly<Record<(typeof featureNamesEn)[number], string>> = {
  "Up to 50 players per game": "Add everyone at the table; a name can be up to 40 characters.",
  "+1 / −1 buttons and custom score changes": "Tap + or − for one point, or tap the score to add or subtract any amount.",
  "Leaderboard ranked by score": "Players are ranked by score, with 🥇 🥈 🥉 for the top three; tied players share a place.",
  "Share the leaderboard as text": "Share sends the ranked leaderboard to any chat; where there is no share menu, a window offers WhatsApp and Copy.",
  "Works offline after the first visit": "After the first visit the score keeper opens and works without internet.",
  "Game saved on the device only": "Players and scores stay in this browser on this device; nothing is sent anywhere.",
};

/** The English FAQ. */
export const faqEn: HelpSection["faq"] = [
  {
    q: "Is Scores free?",
    a: "Yes. Scores is part of Quizzard and free to use, with no account, no sign-up and no ads. The source code is open under the MIT licence.",
  },
  {
    q: "Does Scores work offline?",
    a: "Yes, after the first visit. Your browser keeps a copy of Quizzard, so Scores opens and keeps score without internet. A notice in the header shows when you are offline.",
  },
  {
    q: "Where are my scores saved, and are they sent anywhere?",
    a: "Scores saves players and scores in your browser's storage on this device only. Nothing is sent to a server: there are no accounts, cookies or analytics. Clearing the browser's data for the site deletes the saved game.",
  },
  {
    q: "How many players can I add?",
    a: "Scores takes up to 50 players per game. Each score can go from −999,999 to 999,999.",
  },
  {
    q: "How do I share the result?",
    a: "Tap Share on the Leaderboard card. Your device's share menu opens with the ranked leaderboard as text; where there is no share menu, a window offers WhatsApp and Copy.",
  },
  {
    q: "How do I subtract points on an iPhone?",
    a: "Tap the score to open “Adjust score”. On an iPhone or iPad the keyboard that opens has a minus sign: type it before the number, for example −8.",
  },
  {
    q: "Does Scores work for any game?",
    a: "Yes, for any game scored in points, such as Carcassonne, Star Realms, card games or a quiz night. Scores adds and subtracts the points you enter; it does not know the rules of any game.",
  },
];

/** The English Help. */
// Annotated as free of side effects, so a bundle that takes only the parts above drops the texts.
export const helpEn: HelpSection = {
  steps: stepsEn,
  features: /* @__PURE__ */ featureNamesEn.map((name) => ({ name, text: FEATURE_TEXTS[name] })),
  faq: faqEn,
};
