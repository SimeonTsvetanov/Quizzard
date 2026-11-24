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
  /**
   * The one accent (design-system §3): a #RRGGBB that scripts/accent.ts derives both themes from, or
   * an explicit `{ light, dark }` pair that it only checks (text on it, link text and focus ring on
   * bg/surface/raised surface, both themes, WCAG 2.2 AA) — `pnpm generate` fails when one misses.
   */
  readonly accent?: string | { readonly light: string; readonly dark: string };
  /** A colour of its own per mini-app id (Home tile + the tool's screen); a tool without one keeps `accent`. */
  readonly toolAccents?: Readonly<Record<string, { readonly light: string; readonly dark: string }>>;
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
    /** Every option explained. `route` (language-independent, e.g. "#/teams") makes a tool's deep link in llms.txt. */
    readonly features: readonly { readonly name: string; readonly text: string; readonly route?: string }[];
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
  description: "Free toolkit for pub quizzes and game nights: random team generator, score keeper and answer sheet. Works offline, no account, data stays on your device.",
  url: "https://simeontsvetanov.github.io/Quizzard/",
  repo: "https://github.com/SimeonTsvetanov/Quizzard",
  version: "0.18.0",
  languages: ["en", "bg"],
  // Palette C · Emerald (DECISIONS 2026-11-22): white text on the light one (5.00:1), dark text on the dark one.
  accent: { light: "#00804F", dark: "#34D399" },
  // Bold identity per tool (Moni 2026-11-23): Teams keeps the emerald, Scores is the gold of the wizard's
  // stars, Answer sheet the blue of his hat, the quiz creator violet.
  toolAccents: {
    scores: { light: "#A85507", dark: "#FBBF24" },
    sheet: { light: "#1D5FD1", dark: "#6CA8FF" },
    quiz: { light: "#7C3AED", dark: "#B79CFF" },
  },
  categories: ["utilities", "entertainment"],
  // Long-press the installed app's icon → open a tool directly (PLAN T-21). Absolute paths: a manifest
  // resolves URLs against its own address, so a bare "#/teams" would point at manifest.json.
  shortcuts: [
    { name: "Teams", url: "/Quizzard/#/teams" },
    { name: "Scores", url: "/Quizzard/#/scores" },
    { name: "Answer sheet", url: "/Quizzard/#/sheet" },
    { name: "Quiz creator", url: "/Quizzard/#/quiz" },
  ],
  contact: { email: "tsvetanov.simeon@gmail.com" },
  support: { buyMeACoffee: "https://buymeacoffee.com/simeontsvetanov" },
  ai: { builtWithAI: true, usesAIFeatures: false },
  ads: { enabled: false },
  // Carried over from the 2025 site (branch legacy-2025, index.html, commit b68a5ff, 2025-06-25): the Google
  // verification token that site served at this URL. Keeping it keeps that Google account's ownership of the
  // property valid; no new token was made. Remove it only if Moni no longer wants that ownership.
  seo: { googleVerification: "iV0XiTpnAw_U3AGR_IPF40DAbr0Et18Bjg3kLA0HTW8" },
  // Every name a 2025 worker (public/sw.js, then public/service-worker.js) ever used — read from the
  // whole history of branch `legacy-2025` (PLAN T-02, DECISIONS 2026-11-22).
  legacyCacheNames: [
    "quizzard-v1.0.1", "quizzard-static-v1.0.1", "quizzard-v2.1", "quizzard-simple", "quizzard-fixed-theme-2025",
    "quizzard-mint-icons-2025", "quizzard-favicons-new-logo-2024", "quizzard-complete-icons-2025", "quizzard-cache-v1",
  ],
  analytics: { umami: false },
  storage: { tiers: ["prefs", "indexeddb"], stores: ["theme", "language", "dismissed prompts", "report draft", "quizzes"] },
  limits: {},
  feedback: { webhook: null },
  modes: { urlParams: [] },
  help: {
    steps: [
      "Tap Teams to split people into fair random teams.",
      "Tap Scores to keep score during the game.",
      "Tap Answer sheet to write your team's answers and count its points round by round.",
      "Tap Quiz creator to build your own quiz: rounds, questions and a preview of every slide.",
      "The arrow at the top left takes you back to all tools. Install Quizzard to use it offline at your quiz night.",
    ],
    // The four tools, one sentence each: Help → Features, llms.txt, llms-full.txt and the JSON-LD featureList.
    features: [
      { name: "Teams", route: "#/teams", text: "A random team generator: paste or type the names, choose 2 to 10 teams and get fair teams whose sizes differ by at most one, ready to copy or share." },
      { name: "Scores", route: "#/scores", text: "A score keeper for game night: add up to 50 players, change a score with + and − or by any amount, follow the ranked leaderboard and each score's history, and share the leaderboard as text." },
      { name: "Answer sheet", route: "#/sheet", text: "A team's own answer sheet for a pub quiz: write the answers round by round, mark each ✓ or ✗ and see the points per question and per round, bonus points and the running total." },
      { name: "Quiz creator", route: "#/quiz", text: "A quiz maker for your own quiz night: collect questions into rounds, answer them as open, multiple-choice or true/false, set the time and points per round or per question and preview every question as a slide. Quizzes are saved on your device." },
    ],
  },
  moreTools: "https://github.com/SimeonTsvetanov?tab=repositories&q=simeonts-microapp",
  author: { name: "Simeon Tsvetanov", country: "Bulgaria", linkedin: "https://www.linkedin.com/in/simeon-tsvetanov-a00963159", github: "https://github.com/SimeonTsvetanov" },
  faq: [
    { q: "What is Quizzard?", a: "Quizzard is a free toolkit for pub quizzes and game nights with four tools: Teams makes random teams, Scores keeps score for game night, Answer sheet records your team's answers and points and Quiz creator builds your own quiz. It runs in your browser and works offline." },
    { q: "How do I split people into random teams?", a: "Open Teams, type or paste the names one per line, choose 2 to 10 teams and tap “Generate teams”. Every split is equally likely and team sizes differ by at most one." },
    { q: "How do I keep score on game night?", a: "Open Scores, add each player by name and tap + or − on a card to change that score by one point, or tap the score to add or subtract any amount. The leaderboard ranks everyone, each score keeps its history and Share sends the leaderboard as text." },
    { q: "Can I use Quizzard as a pub quiz answer and score sheet?", a: "Yes. Answer sheet is made for your team's scribe: write the answers round by round, mark each one ✓ or ✗ and it counts the points per question and per round, with bonus points and a running total. It replaces pen and paper for your own team's answers." },
    { q: "Is Quizzard free?", a: "Yes. It is free and open source (MIT) and runs in your browser." },
    { q: "Does my data leave my device?", a: "No. Teams, scores, answers and quizzes stay in this browser on your device and are never uploaded. They leave it only when you share a result or send a problem report yourself." },
    { q: "Can my data disappear on an iPhone?", a: "In a Safari tab, yes: Safari may delete the data of a site you have not opened for 7 days. Add Quizzard to the Home Screen and it is kept. To be safe, use Settings → Your data → Export my data." },
    { q: "Do I need an account?", a: "No. There is no account and no sign-in." },
    { q: "Does Quizzard work offline?", a: "Yes. After the first visit it works without a connection, also when installed." },
    { q: "Is Quizzard available in Bulgarian?", a: "Yes. The app is in English and Bulgarian; choose the language in Settings." },
    { q: "Can I make quizzes with Quizzard?", a: "Yes. Open Quiz creator, add rounds and write your questions with open, multiple-choice or true/false answers; each round sets the time and points and every question has a preview. Text questions work today; pictures, audio, video and the export to one file that plays on a TV are on their way." },
  ],
  l10n: {
    bg: {
      // The Bulgarian tagline is Moni's call (PLAN T-19); the English one stands until then.
      tagline: "The Quiz Toolkit",
      description: "Безплатни инструменти за куиз и игрални вечери: случайни отбори, точки и лист с отговори. Работят офлайн, без акаунт, данните остават на Вашето устройство.",
      help: {
        steps: [
          "Докоснете „Отбори“, за да разделите хората на честни случайни отбори.",
          "Докоснете „Точки“, за да водите резултата по време на играта.",
          "Докоснете „Лист с отговори“, за да записвате отговорите на отбора и да броите точките му рунд по рунд.",
          "Докоснете „Създател на куизове“, за да направите свой куиз: рундове, въпроси и преглед на всеки слайд.",
          "Стрелката горе вляво връща към всички инструменти. Инсталирайте Quizzard, за да го ползвате офлайн на куиз вечерта.",
        ],
        features: [
          { name: "Отбори", text: "Генератор на случайни отбори: напишете или поставете имената, изберете от 2 до 10 отбора и получете честни отбори, чийто размер се различава най-много с един, готови за копиране или споделяне." },
          { name: "Точки", text: "Водене на резултат за игрална вечер: добавете до 50 играчи, променяйте точките с + и − или с произволна стойност, следете класирането и историята на всеки резултат и споделете класирането като текст." },
          { name: "Лист с отговори", text: "Собствен лист с отговори на отбора за куиз: записвайте отговорите рунд по рунд, отбелязвайте всеки с ✓ или ✗ и вижте точките за въпрос и за рунд, бонус точките и общия резултат." },
          { name: "Създател на куизове", text: "Инструмент за Вашия собствен куиз: съберете въпроси в рундове, с отворен отговор, избор от няколко или вярно/невярно, задайте време и точки за рунд или за отделен въпрос и прегледайте всеки въпрос като слайд. Куизовете се пазят на Вашето устройство." },
        ],
      },
      faq: [
        { q: "Какво е Quizzard?", a: "Quizzard е безплатен комплект от инструменти за куиз и игрални вечери с четири части: „Отбори“ прави случайни отбори, „Точки“ води резултата на игралната вечер, „Лист с отговори“ записва отговорите и точките на Вашия отбор, а „Създател на куизове“ прави Вашия собствен куиз. Работи в браузъра Ви и без интернет." },
        { q: "Как да разделя хората на случайни отбори?", a: "Отворете „Отбори“, напишете или поставете имената по едно на ред, изберете от 2 до 10 отбора и натиснете „Направи отбори“. Всяко разпределение е еднакво вероятно, а размерът на отборите се различава най-много с един." },
        { q: "Как да водя резултата на игрална вечер?", a: "Отворете „Точки“, добавете всеки играч с име и натиснете + или − на картата му, за да промените точките с една, или натиснете самия резултат, за да добавите или извадите произволна стойност. Класирането подрежда всички, всеки резултат пази историята си, а „Сподели“ изпраща класирането като текст." },
        { q: "Може ли Quizzard да е лист за отговори и точки на куиз?", a: "Да. „Лист с отговори“ е направен за човека, който записва за отбора: пишете отговорите рунд по рунд, отбелязвате всеки с ✓ или ✗, а листът брои точките за въпрос и за рунд, с бонус точки и общ резултат. Заменя химикалката и листа за собствените отговори на отбора Ви." },
        { q: "Безплатен ли е Quizzard?", a: "Да. Безплатен е, с отворен код (MIT) и работи в браузъра Ви." },
        { q: "Напускат ли данните ми устройството?", a: "Не. Отборите, точките, отговорите и куизовете остават в този браузър на Вашето устройство и никога не се качват. Напускат го само когато Вие споделите резултат или изпратите съобщение за проблем." },
        { q: "Могат ли данните ми да изчезнат на iPhone?", a: "В раздел на Safari — да: Safari може да изтрие данните на сайт, който не сте отваряли 7 дни. Добавете Quizzard към началния екран и те се пазят. За сигурност ползвайте Настройки → Вашите данни → Експортирай данните ми." },
        { q: "Нужен ли е акаунт?", a: "Не. Няма акаунт и няма вход." },
        { q: "Работи ли Quizzard офлайн?", a: "Да. След първото посещение работи и без връзка, също и като инсталирано приложение." },
        { q: "Има ли Quizzard на български?", a: "Да. Приложението е на английски и български; изберете езика от „Настройки“." },
        { q: "Мога ли да правя куизове с Quizzard?", a: "Да. Отворете „Създател на куизове“, добавете рундове и напишете въпросите си с отворен отговор, избор от няколко или вярно/невярно; всеки рунд задава времето и точките, а всеки въпрос има преглед. Текстовите въпроси работят още сега; снимките, аудиото, видеото и експортът в един файл за игра на телевизор предстоят." },
      ],
    },
  },
} as const satisfies AppConfig;
