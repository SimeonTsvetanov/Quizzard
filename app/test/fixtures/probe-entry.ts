// Registry line of the routing probe (tests/e2e/routing.spec.ts). The e2e build
// (app/test/vite.e2e.config.ts) puts this module in place of app/src/miniapps/e2e-entries.ts.
import type { MiniAppEntry } from "@simeonts/quizzard-core";

/** The probe mini-app: route `#/probe`, its own storage prefix, lazy chunk `probe-miniapp`. */
export const probeEntry: MiniAppEntry = {
  meta: {
    contract: 1,
    id: "probe",
    name: { en: "Probe", bg: "Проба" },
    tagline: { en: "Routing test mini-app (e2e build only)" },
    icon: "logo.svg",
    languages: ["en", "bg"],
    status: "ready",
    storage: { prefix: "quizzard-probe:v1:" },
  },
  // The contract wants the module as `default`; the probe exports it by name (code-quality §2).
  load: () => import("./probe-miniapp.ts").then(({ probeMiniApp }) => ({ default: probeMiniApp })),
};

/** What the e2e build registers after the shipped mini-apps (same export as e2e-entries.ts). */
export const e2eEntries: readonly MiniAppEntry[] = [probeEntry];
