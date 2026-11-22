/**
 * app.config.ts — the single source of truth for Quizzard (APP-STANDARD §0).
 * Menu, Help, legal pages, llms.txt, JSON-LD, manifest, sitemap and the README usage section are
 * GENERATED from this object. Never duplicate these values elsewhere.
 * Scaffolded from the forge template (PLAN T-01); embed, share target, MCP, API and n8n are not
 * part of Quizzard v1 (SPEC §4), so their config fields were removed.
 */

/** One URL parameter people may put in a link (Help, llms-full.txt). */
export interface UrlParam {
  readonly name: string; // e.g. "teams"
  readonly values: string; // human description of allowed values, e.g. "2–10"
  readonly default: string;
  readonly meaning: string;
}

/** Texts shown to users that also exist in another UI language (app-shell → i18n §3). */
export interface AppText {
  readonly tagline: string;
  readonly description: string;
  readonly help: AppConfig["help"];
  readonly faq: AppConfig["faq"];
}

/** Everything user-facing that the generator, the build and the app read. */
export interface AppConfig {
  readonly id: string; // kebab-case, = storage namespace ("quizzard:v1:…")
  /** URL path on GitHub Pages. Differs from `id` (capital Q, the 2025 site's URL), so it is explicit. */
  readonly basePath: `/${string}/`;
  readonly name: string;
  readonly shortName?: string; // Home Screen label, ≤ 12 chars
  readonly tagline: string; // ≤ 60 chars incl. name in <title> "{name} — {tagline}"
  readonly description: string; // 1–2 sentences, ≤ 155 chars for <meta description>
  readonly url: string; // canonical URL; ends with basePath (generate.ts checks)
  readonly repo: string;
  readonly version: string; // = root package.json "version" (generate.ts fails on a mismatch); build injects it into HTML + JSON-LD
  readonly languages: readonly ("en" | "bg")[]; // English first and default
  /** One entry per extra language in `languages`, same number of steps/features/FAQ (generate.ts checks). */
  readonly l10n?: { readonly bg?: AppText };
  readonly accent?: string; // hex; must pass design color.mjs check
  readonly categories: readonly string[]; // manifest categories, e.g. ["utilities"]
  readonly contact: { readonly email: string };
  readonly support: { readonly buyMeACoffee: string; readonly githubSponsors?: string; readonly kofi?: string };
  readonly ai: { readonly builtWithAI: boolean; readonly usesAIFeatures: boolean; readonly provider?: string; readonly model?: string };
  readonly ads: { readonly enabled: boolean }; // only with a recorded decision
  readonly analytics: { readonly umami: boolean }; // off by default
  readonly storage: { readonly tiers: readonly ("prefs" | "indexeddb" | "opfs")[]; readonly stores: readonly string[] }; // what is saved — feeds Terms/Privacy
  /** Shown in Help, llms.txt. Set maxFileMB only for apps that take files: it also switches the privacy text to "files never leave the device". */
  readonly limits: { readonly maxFileMB?: number; readonly maxItems?: number };
  readonly feedback: { readonly webhook: string | null }; // shared microapp-feedback n8n webhook
  readonly modes: { readonly urlParams: readonly UrlParam[] };
  readonly help: {
    readonly steps: readonly string[]; // Quick start, 3–5 steps with the exact UI labels
    readonly features: readonly { readonly name: string; readonly text: string }[]; // every option explained
  };
  /** "More free tools" link (footer, 404). Until the hub site simeontsvetanov.github.io exists: the GitHub list. */
  readonly moreTools: string;
  readonly author: { readonly name: string; readonly country: string; readonly linkedin?: string; readonly github?: string }; // Legal notice, About, Support, JSON-LD
  /** `wasm: true` adds 'wasm-unsafe-eval' to script-src — only when the build ships .wasm (engineering → security §1). */
  readonly csp?: { readonly wasm?: boolean };
  readonly seo?: { readonly googleVerification?: string }; // Search Console meta token (growth → seo-geo §3); omit when unused
  readonly faq: readonly { readonly q: string; readonly a: string }[]; // 5–10, also FAQPage JSON-LD
  readonly shortcuts?: readonly { readonly name: string; readonly url: string }[];
  /**
   * Cache Storage names an older site at `basePath` left in browsers. The new service worker takes
   * over at once when it finds one and deletes exactly these (scripts/sw-handover.ts); the page then
   * shows no update offer for that take-over (app/src/pwa.ts).
   */
  readonly legacyCacheNames?: readonly string[];
}

export const app = {
  id: "quizzard",
  basePath: "/Quizzard/",
  name: "Quizzard",
  tagline: "The Quiz Toolkit",
  description: "A free toolkit for quiz and game nights: make fair teams and keep score, offline and private in your browser; a quiz creator is planned.",
  url: "https://simeontsvetanov.github.io/Quizzard/",
  repo: "https://github.com/SimeonTsvetanov/Quizzard",
  version: "0.1.0",
  languages: ["en", "bg"],
  categories: ["utilities", "entertainment"],
  contact: { email: "tsvetanov.simeon@gmail.com" },
  support: { buyMeACoffee: "https://buymeacoffee.com/simeontsvetanov" },
  ai: { builtWithAI: true, usesAIFeatures: false },
  ads: { enabled: false },
  // Every name a 2025 worker (public/sw.js, then public/service-worker.js) ever used — read from the
  // whole history of branch `legacy-2025` (PLAN T-02, DECISIONS 2026-11-22).
  legacyCacheNames: [
    "quizzard-v1.0.1", "quizzard-static-v1.0.1", "quizzard-v2.1", "quizzard-simple", "quizzard-fixed-theme-2025",
    "quizzard-mint-icons-2025", "quizzard-favicons-new-logo-2024", "quizzard-complete-icons-2025", "quizzard-cache-v1",
  ],
  analytics: { umami: false },
  storage: { tiers: ["prefs"], stores: ["theme", "language", "dismissed prompts", "report draft"] },
  limits: {},
  feedback: { webhook: null },
  modes: { urlParams: [] },
  help: {
    steps: [
      "Open Quizzard.",
      "Pick a tool: Teams makes fair random teams, Scores keeps the score.",
      "Install Quizzard to use it offline at your quiz night.",
    ],
    features: [],
  },
  moreTools: "https://github.com/SimeonTsvetanov?tab=repositories&q=simeonts-microapp",
  author: { name: "Simeon Tsvetanov", country: "Bulgaria", linkedin: "https://www.linkedin.com/in/simeon-tsvetanov-a00963159", github: "https://github.com/SimeonTsvetanov" },
  faq: [
    { q: "Is Quizzard free?", a: "Yes. It is free and open source (MIT) and runs in your browser." },
    { q: "Does my data leave my device?", a: "No. Everything you enter stays in this browser on your device." },
    { q: "Do I need an account?", a: "No. There is no account and no sign-in." },
    { q: "Does Quizzard work offline?", a: "Yes. After the first visit it works without a connection, also when installed." },
    { q: "Can I make quizzes with Quizzard?", a: "Not yet. A quiz creator is planned; today Quizzard brings the tools for teams and scores." },
  ],
  l10n: {
    bg: {
      // The Bulgarian tagline is Moni's call (PLAN T-19); the English one stands until then.
      tagline: "The Quiz Toolkit",
      description: "Безплатни инструменти за куиз и игрални вечери: честни отбори и точки, офлайн и само в браузъра Ви; предстои и създател на куизове.",
      help: {
        steps: [
          "Отворете Quizzard.",
          "Изберете инструмент: Отбори прави честни случайни отбори, Точки води резултата.",
          "Инсталирайте Quizzard, за да го ползвате офлайн на куиз вечерта.",
        ],
        features: [],
      },
      faq: [
        { q: "Безплатен ли е Quizzard?", a: "Да. Безплатен е, с отворен код (MIT) и работи в браузъра Ви." },
        { q: "Напускат ли данните ми устройството?", a: "Не. Всичко, което въведете, остава в този браузър на Вашето устройство." },
        { q: "Нужен ли е акаунт?", a: "Не. Няма акаунт и няма вход." },
        { q: "Работи ли Quizzard офлайн?", a: "Да. След първото посещение работи и без връзка, също и като инсталирано приложение." },
        { q: "Мога ли да правя куизове с Quizzard?", a: "Още не. Предстои създател на куизове; днес Quizzard предлага инструменти за отбори и точки." },
      ],
    },
  },
} as const satisfies AppConfig;
