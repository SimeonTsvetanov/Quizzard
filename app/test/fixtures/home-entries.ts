// Registry lines that fill Home to 12 cards in the e2e build (tests/e2e/home.spec.ts): 3 shipped +
// the routing probe + these 8. Ready ones mount the probe module (any mounted mini-app will do);
// one has a very long name and tagline to prove cards wrap instead of overflowing at 320 px.
import type { MiniAppEntry, MiniAppMeta } from "@simeonts/quizzard-core";

/** A fixture line: ready ones load the probe, coming ones have nothing to load (core rule). */
function fixture(meta: Pick<MiniAppMeta, "id" | "name" | "tagline" | "icon" | "status">): MiniAppEntry {
  const line = { meta: { ...meta, contract: 1, languages: ["en", "bg"], storage: { prefix: `quizzard-fixture-${meta.id}:v1:` } } } as const;
  if (meta.status === "coming") return line;
  return { ...line, load: () => import("./probe-miniapp.ts").then(({ probeMiniApp }) => ({ default: probeMiniApp })) };
}

/** The eight Home fixtures, in registry order (after the shipped entries and the probe). */
export const homeFixtureEntries: readonly MiniAppEntry[] = [
  fixture({ id: "alpha", name: { en: "Alpha", bg: "Алфа" }, tagline: { en: "First ready fixture", bg: "Първа готова проба" }, icon: "miniapps/teams.svg", status: "ready" }),
  fixture({
    id: "beta",
    name: { en: "Beta with a remarkably long mini-app name that has to wrap" },
    tagline: { en: "Second ready fixture whose tagline is much longer than one line on any phone screen" },
    icon: "miniapps/scores.svg",
    status: "ready",
  }),
  fixture({ id: "gamma", name: { en: "Gamma", bg: "Гама" }, tagline: { en: "Third ready fixture", bg: "Трета готова проба" }, icon: "miniapps/quiz.svg", status: "ready" }),
  fixture({ id: "delta", name: { en: "Delta" }, tagline: { en: "Coming fixture" }, icon: "logo.svg", status: "coming" }),
  fixture({ id: "epsilon", name: { en: "Epsilon" }, tagline: { en: "Coming fixture" }, icon: "miniapps/teams.svg", status: "coming" }),
  fixture({ id: "zeta", name: { en: "Zeta" }, tagline: { en: "Coming fixture" }, icon: "miniapps/scores.svg", status: "coming" }),
  fixture({ id: "eta", name: { en: "Eta" }, tagline: { en: "Coming fixture" }, icon: "miniapps/quiz.svg", status: "coming" }),
  fixture({ id: "theta", name: { en: "Theta" }, tagline: { en: "Coming fixture" }, icon: "logo.svg", status: "coming" }),
];
